type CreateBuildingInput = {
  input: {
    name: string;
    userId: string;
    numberOfApartments: number;
    address: {
      streetAddress: string;
      postalCode: string;
      city: string;
      country: string;
    };
  };
};
