<p align="center">
  <p align="center"> <a href="https://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a> </p> <p align="center"> <b>SCIM (System for Cross-domain Identity Management) Implementation Example</b> using NestJS </p> <p align="center"> A ready-to-use, open-source example demonstrating how to implement SCIM 2.0 endpoints, built with the NestJS framework. </p>
</p>

## Description

This repository provides a working SCIM 2.0 implementation designed to integrate easily with Azure Entra ID (formerly Azure Active Directory) and other SCIM-compatible identity providers.

We spent significant time learning, troubleshooting, and fine-tuning SCIM integration with Azure Entra ID. To save other developers from going through the same hurdles, we (Kevin and Richie) decided to open-source this project.

Our goal is to make SCIM integrations faster, easier, and more reliable for the next developers.

## Features

✅ SCIM 2.0 compliant endpoints

✅ Support for Azure Entra ID provisioning

✅ User and Group resource handling

✅ Example validation, mapping, and response formatting

✅ Built with NestJS and TypeScript

✅ Structured for easy extension to fit your business rules

## SCIM Endpoints Included

|Method | Endpoint | Description|
| ----------- | ----------- |----------- |
|GET | /scim/Users | List or filter users|
|POST | /scim/Users | Create a new user|
|PATCH | /scim/Users/:id | Update user attributes|
|DELETE | /scim/Users/:id | Deactivate or delete user|
|GET | /scim/Groups | List or filter groups|
|POST | /scim/Groups | Create a new group|
|PATCH | /scim/Groups/:id | Update group attributes|
|DELETE | /scim/Groups/:id | Delete group|

## Project setup

```bash
pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
pnpm install -g @nestjs/mau
mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Why We Built This

When integrating SCIM with Azure Entra ID, we realized that:

Azure expects very specific SCIM behaviors (especially around PATCH operations, filtering, and soft deletes).

There were not many good open-source examples available.

Common mistakes like wrong schemas, missing attributes, or response format issues could cause silent failures in Entra ID provisioning.

This project is a reference implementation that works out of the box — helping developers skip the trial-and-error phase and focus on their own business logic.

## Resources

Check out a few resources that may come in handy when implementing SCIM endpoint:

- Visit the [Develop and plan provisioning for a SCIM endpoint](https://learn.microsoft.com/en-us/entra/identity/app-provisioning/use-scim-to-provision-users-and-groups#publish-your-application-to-the-aad-application-gallery) to learn more about the tutorial.
- For SCIM validator, please visit our [SCIM Validator](https://scimvalidator.microsoft.com).
- To dive deeper and get more hands-on experience, check out our official video [NestJS Documentation](https://courses.nestjs.com/).

## Contributing

Contributions are welcome!
If you spot issues, want to improve the project, or add support for more identity providers, feel free to open an issue or submit a pull request.

## Stay in touch

- Author - [Kevin](https://www.linkedin.com/in/kevin-slash/)
- Website - [Slash](https://slash.com/)

## License

This project is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
