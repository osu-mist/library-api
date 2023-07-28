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

## Sample Data for books table:
```sql
INSERT INTO books (book_id, title, author, publication_year, isbn, genre, description, available)
VALUES
  ('B001', 'The Great Gatsby', 'F. Scott Fitzgerald', '1925', '9780743273565', 'Classic', 'A tale of the Jazz Age', 'true'),
  ('B002', 'To Kill a Mockingbird', 'Harper Lee', '1960', '9780061120084', 'Fiction', 'A story about racial injustice', 'true'),
  ('B003', '1984', 'George Orwell', '1949', '9780451524935', 'Dystopian', 'A classic portrayal of totalitarianism', 'true'),
  ('B004', "Harry Potter and the Sorcerer's Stone", 'J.K. Rowling', '1997', '9780590353427', 'Fantasy', 'The start of an epic wizarding adventure', 'true'),
  ('B005', 'Pride and Prejudice', 'Jane Austen', '1813', '9780141439518', 'Romance', 'A tale of love and societal norms', 'true'),
  ('B006', 'The Lord of the Rings', 'J.R.R. Tolkien', '1954', '9780618640157', 'Fantasy', 'A quest to destroy the One Ring', 'true'),
  ('B007', 'Brave New World', 'Aldous Huxley', '1932', '9780060850524', 'Dystopian', 'A vision of a future society', 'true'),
  ('B008', 'The Catcher in the Rye', 'J.D. Salinger', '1951', '9780316769174', 'Coming-of-Age', 'A journey of teenage angst', 'true'),
  ('B009', 'Moby-Dick', 'Herman Melville', '1851', '9780142437247', 'Adventure', 'The hunt for the white whale', 'true'),
  ('B010', 'The Hobbit', 'J.R.R. Tolkien', '1937', '9780547928227', 'Fantasy', 'The adventure of Bilbo Baggins', 'true');
```

## Empty books table:
```sql
TRUNCATE TABLE books;
```

## Drop books table with schema:
```sql
DROP TABLE books;
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

## Sample Data for members table:
```sql
INSERT INTO members (member_id, first_name, last_name, email, address, city, state, country, phone_number, status)
VALUES
  ('M001', 'Alex', 'Taylor', 'alex.taylor@example.com', '123 Oak St', 'New York City', 'NY', 'USA', '555-123-4567', 'active'),
  ('M002', 'Jordan', 'Lee', 'jordan.lee@example.com', '456 Maple Ave', 'Los Angeles', 'CA', 'USA', '555-987-6543', 'active'),
  ('M003', 'Sasha', 'Chen', 'sasha.chen@example.com', '789 Elm Rd', 'Chicago', 'IL', 'USA', '555-111-2222', 'active'),
  ('M004', 'Riley', 'Garcia', 'riley.garcia@example.com', '234 Cedar Blvd', 'Houston', 'TX', 'USA', '555-444-3333', 'active'),
  ('M005', 'Avery', 'Patel', 'avery.patel@example.com', '567 Birch Ln', 'Phoenix', 'AZ', 'USA', '555-555-7777', 'active'),
  ('M006', 'Taylor', 'Nguyen', 'taylor.nguyen@example.com', '890 Pine Dr', 'Philadelphia', 'PA', 'USA', '555-222-9999', 'active'),
  ('M007', 'Cameron', 'Kim', 'cameron.kim@example.com', '987 Elm St', 'San Francisco', 'CA', 'USA', '555-888-1111', 'active'),
  ('M008', 'Casey', 'Singh', 'casey.singh@example.com', '654 Maple Blvd', 'Dallas', 'TX', 'USA', '555-666-4444', 'active'),
  ('M009', 'Jamie', 'Patel', 'jamie.patel@example.com', '321 Cedar Ave', 'Miami', 'FL', 'USA', '555-999-8888', 'active'),
  ('M010', 'Jordan', 'Connor', 'jordan.connor@example.com', '876 Oak Rd', 'Atlanta', 'GA', 'USA', '555-777-2222', 'active');
```

## Empty members table:
```sql
TRUNCATE TABLE members;
```

## Drop members table with schema:
```sql
DROP TABLE members;
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

## Sample Data for borrows table:
```sql
INSERT INTO borrows (borrow_id, book_id, member_id, borrow_date, due_date, return_date, status)
VALUES
  ('BR001', 'B001', 'M001', TO_DATE('2023-07-01', 'YYYY-MM-DD'), TO_DATE('2023-07-15', 'YYYY-MM-DD'), TO_DATE('2023-07-10', 'YYYY-MM-DD'), 'returned'),
  ('BR002', 'B002', 'M002', TO_DATE('2023-07-02', 'YYYY-MM-DD'), TO_DATE('2023-07-16', 'YYYY-MM-DD'), NULL, 'ongoing'),
  ('BR003', 'B003', 'M003', TO_DATE('2023-07-03', 'YYYY-MM-DD'), TO_DATE('2023-07-17', 'YYYY-MM-DD'), NULL, 'ongoing'),
  ('BR004', 'B004', 'M004', TO_DATE('2023-07-04', 'YYYY-MM-DD'), TO_DATE('2023-07-18', 'YYYY-MM-DD'), NULL, 'ongoing'),
  ('BR005', 'B005', 'M005', TO_DATE('2023-07-05', 'YYYY-MM-DD'), TO_DATE('2023-07-19', 'YYYY-MM-DD'), TO_DATE('2023-07-18', 'YYYY-MM-DD'), 'returned'),
  ('BR006', 'B006', 'M006', TO_DATE('2023-07-06', 'YYYY-MM-DD'), TO_DATE('2023-07-20', 'YYYY-MM-DD'), NULL, 'ongoing'),
  ('BR007', 'B007', 'M007', TO_DATE('2023-07-07', 'YYYY-MM-DD'), TO_DATE('2023-07-21', 'YYYY-MM-DD'), NULL, 'ongoing'),
  ('BR008', 'B008', 'M008', TO_DATE('2023-07-08', 'YYYY-MM-DD'), TO_DATE('2023-07-22', 'YYYY-MM-DD'), NULL, 'ongoing'),
  ('BR009', 'B009', 'M009', TO_DATE('2023-07-09', 'YYYY-MM-DD'), TO_DATE('2023-07-23', 'YYYY-MM-DD'), TO_DATE('2023-07-20', 'YYYY-MM-DD'), 'returned'),
  ('BR010', 'B010', 'M010', TO_DATE('2023-07-10', 'YYYY-MM-DD'), TO_DATE('2023-07-24', 'YYYY-MM-DD'), TO_DATE('2023-07-21', 'YYYY-MM-DD'), 'returned');
```

## Empty borrows table:
```sql
TRUNCATE TABLE borrows;
```

## Drop borrows table with schema:
```sql
DROP TABLE borrows;
```