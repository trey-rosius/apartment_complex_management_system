## Welcome to the Apartment Complex Management System(ACMS) Serverless Application

## Concept

ACMS is an attempt at using Serverless technology to build a system where building owners can:

- Create an account.
- Register the buildings(name, address, number of apartments etc) that they own.
- Assign and keep Caretakers to manage each of those buildings.
- Keep track of the tenants occupying the apartments in the building.
- Keep track of occupied and vacant apartments, bookings,payments, and a lot more in each of their building.
- And other useful information that’ll provide more insights on the management of their buildings.

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
PK:USER#USERID
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

- assign a caretaker to a particular building

```jsx
BUILDING#BUILDINGID
USER#USERNAME
```

Tenants

- Create/update/read/delete account

```jsx
PK:USER#USERNAME
SK:USER#EMAIL

```

- List all Buildings in their Area

```jsx
use `longitude` and `latitude`
PK:BUILDING
SK:BUILDING#BUILDINGID
```

- List available apartments for each building

```jsx
conditional expressiong `where status==available`
PK:BUILDING#BUILDINGID
SK:APARTMENT#
```

- Book an apartment
-

```jsx

BOOKING_STATUS = PENDING

PK:USER#USERNAME
SK:APARTMENT#APARTMENTID
GSI
GSI1PK:BUILDING#BUILDINGID
GSI1SK:APARTMENT#APARTMENTID#STATUS
```

- View all apartments booked by you

```jsx
starts_with(APARTMENT#)
condition booked_by == userId
PK:BUILDING#BUILDINGID
SK:APARTMENT#
```

- Pay for apartment once booking status == ‘ACCEPTED’

Caretaker

- View all apartments(Available, unavailable) in Building
-

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
