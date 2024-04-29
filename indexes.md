# Indexes

## Admins table
- Index 1: Hash index on Emails. This will help with queries during login.

## Member table
- Index 2: Hash index on Emails. This will help with queries during login and finding members when admins search for them.

## Books table
- Index 3: BTree index on ['Title', 'Author', 'Genre', 'Year', 'Language']. This will help with queries when searching for books according to the specific criteria.

# Github
https://github.com/manasparanjape/CS348_Project
