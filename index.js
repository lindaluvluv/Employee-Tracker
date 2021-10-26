const mysql2 = require("mysql2");
const inquirer = require("inquirer");
const consoleTable = require("console.table");
const express = require("express");
const PORT = process.env.PORT || 3001;
const app = express();

// connection to database
const connection = mysql2.createConnection(
  {
    host: "localhost",
    user: "root",
    password: "password",
    database: "employee_db",
  },
  console.log(`Connected to the employee_db database.`)
);

// ALL database query use promise to enhance readability
async function findDepartments() {
  return new Promise((resolve, reject) => {
    connection.query(`SELECT * FROM departments`, function (err, results) {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

async function findRoles() {
  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT roles.id, roles.title,roles.salary,departments.department_name 
        FROM roles, departments WHERE roles.department_id=departments.id`,
      function (err, results) {
        if (err) reject(err);
        else resolve(results);
      }
    );
  });
}

async function findEmployees() {
  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT 
      employees.id, 
      employees.first_name, 
      employees.last_name,
      roles.title as job_title, 
      roles.salary as salary,
      managers.first_name as manager_first_name,
      managers.last_name as manager_last_name, 
      departments.department_name as department_name FROM 
      employees LEFT JOIN employees managers ON employees.manager_id=managers.id, departments, roles WHERE 
      employees.role_id=roles.id AND 
      roles.department_id=departments.id`,
      function (err, results) {
        if (err) reject(err);
        else resolve(results);
      }
    );
  });
}

async function createDepartment(department_name) {
  return new Promise((resolve, reject) => {
    connection.query(
      `INSERT INTO departments (department_name)VALUES('${department_name}') `,
      function (err, results) {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      }
    );
  });
}

async function createRole(title, salary, department_id) {
  return new Promise((resolve, reject) => {
    connection.query(
      `INSERT INTO roles (title, salary, department_id) VALUES (
      '${title}',
      ${salary},
      ${department_id}
    )`,
      function (err, results) {
        if (err) reject(err);
        resolve(results);
      }
    );
  });
}

async function createEmployee(first_name, last_name, role_id, manager_id) {
  return new Promise((resolve, reject) => {
    connection.query(
      `INSERT INTO employees (first_name, last_name, role_id, manager_id) VALUES (
      '${first_name}',
      '${last_name}',
      ${role_id},
      ${manager_id}
    )`,
      function (err, results) {
        if (err) reject(err);
        else resolve(results);
      }
    );
  });
}

async function updateEmployeeRole(employee_id, role_id) {
  return new Promise((resolve, reject) => {
    connection.query(
      `UPDATE employees SET role_id=${role_id} WHERE id=${employee_id}`,
      function (err, results) {
        if (err) reject(err);
        else resolve(results);
      }
    );
  });
}

let userAnswer;
let departments;
let roles;
let employees;
let employee_full_name;

function start() {
  inquirer
    .prompt([
      {
        type: "list",
        name: "option",
        message: "Please select a option",
        choices: [
          "view all departments",
          "view all roles",
          "view all employees",
          "add a department",
          "add a role",
          "add an employee",
          "update an employee role",
          "quit",
        ],
      },
    ])
    .then(async (answer) => {
      try {
        // use switch to match user option
        switch (answer.option) {
          case "view all departments":
            departments = await findDepartments();
            console.table(departments);
            break;

          case "view all roles":
            roles = await findRoles();
            console.table(roles);
            break;

          case "view all employees":
            employees = await findEmployees();
            console.table(employees);
            break;

          case "add a department":
            userAnswer = await inquirer.prompt([
              {
                type: "input",
                message: "Please enter the name of department: ",
                name: "department_name",
              },
            ]);
            await createDepartment(userAnswer.department_name);
            console.log("Success to add department!");
            break;

          case "add a role":
            departments = await findDepartments();
            userAnswer = await inquirer.prompt([
              {
                type: "input",
                message: "Please enter the name: ",
                name: "name",
              },
              {
                type: "input",
                message: "Please enter salary: ",
                name: "salary",
              },
              {
                type: "list",
                name: "department_name",
                message: "Please select department: ",
                choices: departments.map(
                  (department) => department.department_name
                ),
              },
            ]);
            await createRole(
              userAnswer.name,
              userAnswer.salary,
              departments.find(
                (department) =>
                  department.department_name === userAnswer.department_name
              ).id
            );
            console.log("Success to add role!");
            break;

          case "add an employee":
            roles = await findRoles();
            employees = await findEmployees();
            userAnswer = await inquirer.prompt([
              {
                type: "input",
                message: "Please enter employee's first name: ",
                name: "first_name",
              },
              {
                type: "input",
                message: "Please enter employee's last name:",
                name: "last_name",
              },
              {
                type: "list",
                message: "Please select employee's role: ",
                name: "role",
                choices: roles.map((role) => role.title),
              },
              {
                type: "list",
                message: "Please select employee's manager: ",
                name: "manager",
                choices: employees.map(
                  (employee) => employee.first_name + " " + employee.last_name
                ),
              },
            ]);
            await createEmployee(
              userAnswer.first_name,
              userAnswer.last_name,
              roles.find((role) => role.title === userAnswer.role).id,
              employees.find(
                (employee) =>
                  employee.first_name + " " + employee.last_name ===
                  userAnswer.manager
              ).id
            );
            console.log("Success to add employee!");
            break;

          case "update an employee role":
            employees = await findEmployees();
            roles = await findRoles();
            userAnswer = await inquirer.prompt([
              {
                type: "list",
                message: "Please select a employee to update: ",
                name: "employee",
                choices: employees.map(
                  (employee) => employee.first_name + " " + employee.last_name
                ),
              },
            ]);
            employee_full_name = userAnswer.employee;
            userAnswer = await inquirer.prompt([
              {
                type: "list",
                message: "Please select employee's role: ",
                name: "role",
                choices: roles.map((role) => role.title),
              },
            ]);
            await updateEmployeeRole(
              employees.find(
                (employee) =>
                  employee.first_name + " " + employee.last_name ===
                  employee_full_name
              ).id,
              roles.find((role) => role.title === userAnswer.role).id
            );
            console.log("Success to update employee role!");
            break;

          case "quit":
            console.log("bye!");
            process.exit(0);
        }
      } catch (err) {
        console.log(err);
        process.exit(0);
      }
      start();
    })
    .catch((err) => {
      console.log(err);
      process.exit(0);
    });
}

start();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});