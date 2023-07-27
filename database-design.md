# Oracle Database Schema for Library API

## Table: books

| Column Name       | Data Type   | Constraints                             | Description                              |
|-------------------|-------------|-----------------------------------------|------------------------------------------|
| book_id           | VARCHAR2(50)| PRIMARY KEY                             | Unique identifier for the book.          |
| title             | VARCHAR2(255)| NOT NULL                                | Title of the book.                       |
| author            | VARCHAR2(255)| NOT NULL                                | Author of the book.                      |
| publication_year  | VARCHAR2(4)      | NOT NULL                                | Publication year of the book.            |
| isbn              | VARCHAR2(50)|                                         | International Standard Book Number (ISBN) for the book. |
| genre             | VARCHAR2(100)| NOT NULL                                | Genre of the book.                       |
| description       | VARCHAR2(500)|                                         | Description or summary of the book.      |
| available         | VARCHAR2(5) | CHECK (available IN ('true', 'false')) | Availability of the book (true/false).   |

## Generate books table in SQL:
```sql
CREATE TABLE books (
  book_id VARCHAR2(50) PRIMARY KEY,
  title VARCHAR2(255) NOT NULL,
  author VARCHAR2(255) NOT NULL,
  publication_year VARCHAR2(4) NOT NULL,
  isbn VARCHAR2(50),
  genre VARCHAR2(100) NOT NULL,
  description VARCHAR2(500),
  available VARCHAR2(5) CHECK (available IN ('true', 'false'))
);
```

## Table: members

| Column Name       | Data Type   | Constraints                             | Description                              |
|-------------------|-------------|-----------------------------------------|------------------------------------------|
| member_id         | VARCHAR2(50)| PRIMARY KEY                             | Unique identifier for the member.        |
| first_name        | VARCHAR2(100)| NOT NULL                                | First name of the member.                |
| last_name         | VARCHAR2(100)| NOT NULL                                | Last name of the member.                 |
| email             | VARCHAR2(255)| NOT NULL                                | Email of the member.                     |
| address           | VARCHAR2(255)| NOT NULL                                | Street address of the member.            |
| city              | VARCHAR2(100)| NOT NULL                                | City of the member.                      |
| state             | VARCHAR2(2)  | NOT NULL CHECK (REGEXP_LIKE(state, '^\[A-Z]{2}$')) | State of the member (two-letter code).  |
| country           | VARCHAR2(50)| NOT NULL                                | Country of the member.                   |
| phone_number      | VARCHAR2(15)| NOT NULL CHECK (REGEXP_LIKE(phone_number, '^\d{3}-\d{3}-\d{4}$')) | Phone number of the member.       |
| status            | VARCHAR2(10)| CHECK (status IN ('active', 'suspended', 'expired')) | Membership status of the member.  |

## Generate members table in SQL:
```sql
CREATE TABLE members (
  member_id VARCHAR2(50) PRIMARY KEY,
  first_name VARCHAR2(100) NOT NULL,
  last_name VARCHAR2(100) NOT NULL,
  email VARCHAR2(255) NOT NULL,
  address VARCHAR2(255) NOT NULL,
  city VARCHAR2(100) NOT NULL,
  state VARCHAR2(2) NOT NULL CHECK (REGEXP_LIKE(state, '^[A-Z]{2}$')),
  country VARCHAR2(50) NOT NULL,
  phone_number VARCHAR2(15) NOT NULL CHECK (REGEXP_LIKE(phone_number, '^\d{3}-\d{3}-\d{4}$')),
  status VARCHAR2(10) CHECK (status IN ('active', 'suspended', 'expired'))
);
```

## Table: borrows

| Column Name       | Data Type   | Constraints                             | Description                              |
|-------------------|-------------|-----------------------------------------|------------------------------------------|
| borrow_id         | VARCHAR2(50)| PRIMARY KEY                             | Unique identifier for the borrow record. |
| book_id           | VARCHAR2(50)| REFERENCES books(book_id)               | Foreign key to book_id in books table.   |
| member_id         | VARCHAR2(50)| REFERENCES members(member_id)           | Foreign key to member_id in members table.|
| borrow_date       | DATE        | NOT NULL                                | Date when the book was borrowed.         |
| due_date          | DATE        | NOT NULL                                | Due date for returning the book.         |
| return_date       | DATE        |                                         | Date when the book was returned.         |
| status            | VARCHAR2(10)| CHECK (status IN ('ongoing', 'returned', 'overdue')) | Borrow status of the book.       |

## Generate borrows table in SQL:
```sql
CREATE TABLE borrows (
  borrow_id VARCHAR2(50) PRIMARY KEY,
  book_id VARCHAR2(50) REFERENCES books(book_id),
  member_id VARCHAR2(50) REFERENCES members(member_id),
  borrow_date DATE NOT NULL,
  due_date DATE NOT NULL,
  return_date DATE,
  status VARCHAR2(10) CHECK (status IN ('ongoing', 'returned', 'overdue'))
);
```
