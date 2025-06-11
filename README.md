# Reverse_engineering_challenge

Repository used to store reverse engineering technical challenge task

## Task Description

- We are trying to reverse engineer a legacy application, given its url and an authentication credential.

- The application is a web application that uses cookies for handling sessions, and has a private API for the resources (users).
- The goal is to create a typescript project that simulates the requests and responses of the application in the command line.
- The project should be able to authenticate the user and retrieve the user information from the private API.
- The project should be able to handle cookies and sessions, and should be able to simulate the requests and responses of the application in the command line.

## Plan Description

- The first step was to analyze the application using a web browser and web inspector tools to verify the requests and responses.

### Application analysis


#### Login page 


The login page presents a form with two fields: username and password.
Submitting the form sends a POST request to the server with the credentials.

- Wrong credentials result in an error message: invalid credentials.
- Correct credentials redirect to the main page, which contains a list of users.

The http request for the login page is as follows:

![Login page inspected](images/1-login_headers.png)

This request is the GET request that retrieves the login page. The response contains the HTML of the login page.

![Login page post request](images/3-login_request_parameters.png)

the request method is POST, and the request parameters are the username and password fields. The response is a redirect to the main page, which contains a list of users.
A success response is indicated by a 302 status code, which means the request was successful and the user was redirected to the main page.






#### List of users page


![List of users](images/2-lists_request_initiators.png)

The redirection to the list of users page is initiated by the successful login request. The list of users page is a GET request that retrieves the list of users from the server.
However, the GET request calls upon a POST request to the private API to retrieve a JSON object containing the list of users.



#### User details page



- Next, we created the typescript project to simulate the requests and responses of the application in the command line.

- The tools used were:
  - Node.js
  - TypeScript
  - fetch Cookie
  - node fetch
- The code was written in TypeScript to ensure type safety and better maintainability.

- The platform used cookies for handling sessions, and has a private API for the resources (users)

## Running the code


### Steps to run the project

To run the project, you need to do the following steps:

1- Clone the repository:
```bash
git clone
```

2- Navigate to the project directory:
```bash
cd reverse_engineering_challenge
```

3- Install the dependencies:
```bash
npm install
```

4- Run the code:
```bash
npm run start
```

#### Dependencies (In case you need to install them manually)

    ├── @eslint/js@9.28.0
    ├── @types/node-fetch@2.6.12
    ├── @types/node@22.15.30
    ├── @typescript-eslint/eslint-plugin@8.33.1
    ├── @typescript-eslint/parser@8.33.1
    ├── eslint@9.28.0
    ├── fetch-cookie@3.1.0
    ├── globals@16.2.0
    ├── node-fetch@3.3.2
    ├── prettier@3.5.3
    ├── puppeteer@24.10.0
    ├── tough-cookie@5.1.2
    ├── ts-node@10.9.2
    ├── typescript-eslint@8.33.1
    └── typescript@5.8.3



## Author

The code was written by [Pericles001](github.com/Pericles001).

Feel free to reach out if you have any questions or suggestions.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

