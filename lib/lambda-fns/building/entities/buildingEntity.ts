interface BuildingParameters {
  id: string;
  name: string;
  userId: string;
  numberOfApartments: number;
  address: {
    streetAddress: string;
    postalCode: string;
    city: string;
    country: string;
  };
  createdOn: string;
}
export class BuildingEntity {
  id: string;
  name: string;
  userId: string;
  numberOfApartments: number;
  address: {
    streetAddress: string;
    postalCode: string;
    city: string;
    country: string;
  };
  createdOn: string;
  constructor({
    id,
    name,
    userId,
    numberOfApartments,
    createdOn,
    address,
  }: BuildingParameters) {
    this.id = id;
    this.name = name;
    this.userId = userId;
    this.numberOfApartments = numberOfApartments;
    this.address = address;
    this.createdOn = createdOn;
  }

  key() {
    return {
      PK: `BUILDING#${this.id}`,
      SK: `BUILDING#${this.id}`,
    };
  }

  toItem() {
    return {
      ...this.key(),
      id: this.id,
      ENTITY: "BUILDING",
      name: this.name,
      userId: this.userId,
      numberOfApartments: this.numberOfApartments,
      address: {
        streetAddress: this.address.streetAddress,
        postalCode: this.address.postalCode,
        city: this.address.city,
        country: this.address.country,
      },
      createdOn: this.createdOn,
    };
  }

  graphQlReturn() {
    return {
      id: this.id,
      name: this.name,
      userId: this.userId,
      numberOfApartments: this.numberOfApartments,
      address: {
        streetAddress: this.address.streetAddress,
        postalCode: this.address.postalCode,
        city: this.address.city,
        country: this.address.country,
      },
      createdOn: this.createdOn,
    };
  }
}
