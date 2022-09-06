## Welcome to the Apartment Complex Management System(ACMS) Serverless Application

## Concept

ACMS is an attempt at using Serverless technology to build a system where building owners can:

- Create an account.
- Register the buildings(name, address, number of apartments etc) that they own.
- Assign and keep Caretakers to manage each of those buildings.
- Keep track of the tenants occupying the apartments in the building.
- Keep track of occupied and vacant apartments, bookings,payments, and a lot more in each of their building.
- And other useful information that’ll provide more insights on the management of their buildings.

In this series, we'll build and deploy a serverless GraphQL API with Appsync,CDK and Typescript.

## Solutions Architecture

![alt text](https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/apartment.jpeg)

## ERD(Entity Relationship Diagram)

### Entities

- Buildings(A building has many apartments)
- Apartments(Apartments are in buildings)
- Bookings(Each apartment can have multiple pending bookings. Once a booking has been approved, payment can be made. )
- Notifications(Light, Water, internet bills due)
- Payments(Before payment, booking status equals Approved. After payment, booking status equals PAID )
- Users(Administrators,CareTakers, Tenants)

### Relationships between entities

Buildings and Apartments share a one to many relationship(one building can have multiple apartments)

Apartments and Bookings share a one to many relationship(One Apartment can have multiple bookings. Whoever pays first gets in)

Users and Apartments share a one to many relationship(One user can have multiple apartments)

Users and Bookings share a one to many relationship(One user can create multiple bookings)

Users and Payments share a one to many relationship

![alt text](https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/entity_relationship_apartment.jpeg)

# Access Patterns

Administrator

- Create/update/delete Administrator accounts.

```jsx
PK:USER#USERNAME
SK:USER#EMAIL
```

- Create/Update/Read/List/Delete Buildings

```jsx
PK:BUILDING
SK:BUILDING#BUILDINGID
```

- Create/Update/Delete Apartments

```jsx
PK:BUILDING#BUILDINGID
SK:APARTMENT#APARTMENTID
```

- list all buildings

```jsx
starts_with(BUILDING#)
PK:BUILDING
SK: BUILDING#
```

- list apartments per building

```jsx
starts_with(APARTMENT#)
PK:BUILDING#BUILDINGID
SK:APARTMENT#
```

- list all bookings per apartment

```jsx
begins_with(BOOKINGS#)
PK:APARTMENTS#APARTMENTID
SK:BOOKINGS#
```

Tenants

- Create/update/read/delete account

```jsx
PK:USER#USERNAME
SK:USER#EMAIL

```

- List all Buildings in their Area

```jsx
filter with `longitude` and `latitude`
PK:BUILDING
SK:BUILDING#BUILDINGID
```

- List available apartments for each building

```jsx
conditional expression `where status==available`
PK:BUILDING#BUILDINGID
SK:APARTMENT#
```

- Book an apartment

```jsx

BOOKING_STATUS = PENDING

PK:USER#USERNAME
SK:APARTMENT#APARTMENTID
GSI
GSI1PK:BUILDING#BUILDINGID
GSI1SK:APARTMENT#APARTMENTID#STATUS
```

### Single Table Design DATABASE SCHEMA

| Entity                 | PK                  | SK                    | GSI1PK                | GSI1SK              |
| ---------------------- | ------------------- | --------------------- | --------------------- | ------------------- |
| Building               | BUILDING            | BUILDING#BUILDINGID   | USER#USERID           | BUILDING#BUILDINGID |
| Apartment              | BUILDING#BUILDINGID | APARTMENT#APARTMENTID |                       |                     |
| Booking                | USER#USERID         | APARTMENT#APARTMENTID | APARTMENT#APARTMENTID | BOOKING#BOOKINGID   |
| Payment                | USER#USERID         | PAYMENT#PAYMENTID     | APARTMENT#APARTMENTID | PAYMENT#PAYMENTID   |
| User                   | USER#USERID         | USER#USEREMAIL        |                       |                     |
| Messages/Notifications | USER#USERID         | MESSAGE#MESSAGEID     |                       |                     |

## NOSQL WORKBENCH

![alt text](https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/acms-table.png)

### Get All Apartments Per Building

![alt text](https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/GSI_acms-table_getAllApartmentsPerBuilding.png)

### Get All Bookings Per Apartment

![alt text](https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/GSI_acms-table_getAllBookingsPerApartment.png)

### Get All Buildings Per User

![alt text](https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/GSI_acms-table_getAllBuildingsPerUser.png)

## Prerequisites

Please make sure you have these dependencies installed before proceeding.

- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-welcome.html)
- [AWS ACCOUNT AND USER](https://cdkworkshop.com/15-prerequisites/200-account.html)
- [Node Js](https://cdkworkshop.com/15-prerequisites/300-nodejs.html)
- [AWS CDK ToolKit](https://cdkworkshop.com/15-prerequisites/500-toolkit.html)

- [AWS AppSync](https://aws.amazon.com/appsync/) is a fully managed serverless service that makes it easy to develop GraphQL APIs in the cloud. It handles the heavy lifting of managing a complex GraphQL backend infrastructure, securely connecting to data sources, adding caches to improve performance, subscriptions to support real-time updates, and client-side data stores that keep offline clients in sync.

- GraphQL provides a flexible typed data query language for APIs as well as a runtime to fulfill these queries

- The [AWS Cloud Development Kit (AWS CDK)](https://aws.amazon.com/cdk/) is an open-source software development framework to define your cloud application resources using familiar programming languages

## GET STARTED

We are going to have 5 stacks

- The main application Stack(Defines the Appsync API, Database, Datasource etc for the complete app)
- A User Stack (For User Resources)
- A Building Stack (For Building Resources)
- An Apartment Stack (For Apartment Resources)
- A Bookings Stack (For Booking Resources)

We'll initialize our DB
