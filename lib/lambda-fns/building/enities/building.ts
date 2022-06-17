class Building {
  name: string;
  numberOfApartments: number;
  address: Address;
  createdOn: string;
  constructor(
    name: string,
    numberOfApartments: number,
    createdOn: string,
    address: Address
  ) {
    this.name = name;
    this.numberOfApartments = numberOfApartments;
    this.address = address;
    this.createdOn = createdOn;
  }
}

class Address {
  streetAddress: string;
  postalCode: string;
  city: string;
  country: string;
  constructor(
    streetAddress: string,
    postalCode: string,
    city: string,
    country: string
  ) {
    this.streetAddress = streetAddress;
    this.postalCode = postalCode;
    this.city = city;
    this.country = country;
  }
}
