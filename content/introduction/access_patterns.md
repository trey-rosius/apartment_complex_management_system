# Access Patterns

Administrator

- Create/update/delete Administrator accounts.

```jsx
PK:USER#EMAIL
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
PK:USER#EMAIL
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

### Single Table DynamoDB Design



![alt text](https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/entity_graphs.png)


## NOSQL WORKBENCH

![alt text](https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/acms-table.png)

### Get All Apartments Per Building

![alt text](https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/GSI_acms-table_getAllApartmentsPerBuilding.png)

### Get All Bookings Per Apartment

![https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/GSI_acms-table_getAllBookingsPerApartment.png](https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/GSI_acms-table_getAllBookingsPerApartment.png)

alt text

### Get All Buildings Per User

![https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/GSI_acms-table_getAllBuildingsPerUser.png](https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/GSI_acms-table_getAllBuildingsPerUser.png)

alt text
