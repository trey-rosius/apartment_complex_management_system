type User = {
  id: string;
  firstName: string;
  lastName: string;
  verified: boolean;
  email: string;
  userType: UserType;
  createdOn: string;
  updatedOn: string;
};

type UserInput = {
  firstName: string;
  lastName: string;
  email: string;
  verified: boolean;
  userType: UserType;
  createdOn: string;
};

enum UserType {
  ADMIN,
  TENANT,
  CARETAKER,
}
