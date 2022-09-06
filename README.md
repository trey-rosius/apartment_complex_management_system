## Welcome to the Apartment Complex Management System(ACMS) Serverless Application

## Concept

ACMS is an attempt at using Serverless technology to build a system where building owners can:

- Create an account.
- Register the buildings(name, address, number of apartments etc) that they own.
- Assign and keep Caretakers to manage each of those buildings.
- Keep track of the tenants occupying the apartments in the building.
- Keep track of occupied and vacant apartments, bookings,payments, and a lot more in each of their building.
- And other useful information that’ll provide more insights on the management of their buildings.

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

### Single Table Design Data Representation

![alt text](https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/acms-table.png)
![alt text](https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/GSI_acms-table_getAllApartmentsPerBuilding.png)
![alt text](https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/GSI_acms-table_getAllBookingsPerApartment.png)
