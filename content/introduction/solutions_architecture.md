## Solutions Architecture

![alt text](https://github.com/trey-rosius/apartment_complex_management_system/raw/master/assets/apartment.jpeg)

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
