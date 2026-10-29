# Winston Specifications

After one person pays for a whole trip, each remaining person owes:

```text
(TotalCost - sum of all PersonalCost) / TotalUsers + PersonalCost
```

Every time you pay someone back for a trip, log your transaction to update the running totals of how much everyone owes each other.

The sum of all personal costs cannot exceed the total cost of the trip.

# Schema

### `User`

| Field | Description |
| :--- | :--- |
| `Id` | Unique identifier |
| `Name` | Name of the user |
| `AvatarUrl` | URL to the avatar image of the user (optional) |

### `Trip`

| Field | Description |
| :--- | :--- |
| `Id` | Unique identifier |
| `OwnerId` | ID of the user who paid/created the trip |
| `Name` | Name/title of the trip |
| `Date` | Date of the trip |
| `Total` | Total cost of the trip |
| `TripUsers` | List of users participating in the trip |
| `Notes` | Additional notes (optional) |
| `ReceiptImageUrl` | URL to the uploaded receipt image (optional) |

### `TripUser`

| Field | Description |
| :--- | :--- |
| `UserId` | Reference to the user |
| `TripId` | Reference to the trip |
| `PersonalCost` | Specific, additional portion of total cost that is just for this user |

### `Transaction`

| Field | Description |
| :--- | :--- |
| `Id` | Unique identifier |
| `SenderId` | Reference to the user sending money |
| `RecipientId` | Reference to the user receiving money |
| `Date` | Date of the transaction |
| `Cost` | Amount paid |
| `RecipientDidNotReceive` | Flag indicating if the recipient has marked it as not received |
| `Notes` | Additional notes (optional) |

# Pages

## Login

Log in using Microsoft Entra ID.

## Access Denied

Shown when the signed-in account is not included in the allow-list.

The user can request access or sign out.

## Home

A list of how much the logged-in `User` owes and is owed.

For each `User`:

- if the `User` owes money to the currently logged-in `User`, it says “`User` owes you `$xx.xx`”;
- if the `User` is owed money by the currently logged-in `User`, it says “`User` is owed `$xx.xx`”;
- if neither user owes the other money, no text is displayed.

## Edit Trip

A form to create or edit a `Trip` object.

On creation, the owner and first user are always the currently logged-in `User`.

- An editable title with default “New Trip”
- Date input
- Total cost input
- List of participating users
- Optional personal cost for each user
- Receipt upload
- Notes
- Summary of how much each user owes
- Save Trip button

The owning user cannot be deleted. The sum of all personal costs cannot exceed the total cost.

## Edit Transaction

A form to create or edit a `Transaction` object.

On creation, the sender is the currently logged-in `User`.

- Date input
- Recipient dropdown
- Cost input
- Notes
- Save Transaction button

## Trips

A list with the following for each `Trip`:

- the trip name;
- an accordion list for each user in `TripUsers`;
- each user’s calculated share; and
- an Edit Trip button.

## Transactions

A list with the following for each `Transaction`:

- “`Sender` paid `Recipient` `$xx.xx` on `Date`”;
- “Not Received!” if `RecipientDidNotReceive` is set; and
- a button allowing the recipient to mark the transaction received or not received.

The list is sorted first by transactions marked not received and then by date.

## Settings

- Logout button
