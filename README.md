# BorrowBox - Mobile App (MVP)

A hyperlocal item-sharing platform that connects neighbors who want to lend household items with neighbors who need to borrow them briefly.

## Project Information

**Student Name:** Tobby Akinwale  
**Student ID:** B00165442  
**Course:** Business & IT  
**Institution:** TU Dublin - Blanchardstown  
**Assignment:** CA2 - Develop a Mobile App  

## Executive Summary

BorrowBox is a React Native mobile application that enables neighbors to share household items instead of purchasing them. This MVP (Minimum Viable Product) demonstrates the core functionality of the platform: user registration, item listing, browsing, and request management. The app addresses the problem of wasteful spending on seldom-used household items while fostering community connections.

## MVP Features

This proof-of-concept implements the following core features:

### 1. User Authentication
- User registration with name and email
- User login functionality
- Dual role support (users can be both Borrowers and Lenders)

### 2. Lender Features
- **Add Item Form**: Create listings with title, description, category, image, and pricing (daily rate or free)
- **My Items Screen**: View all listed items with edit and delete capabilities
- **Request Management**: 
  - View borrower profiles (personal information, reviews, location)
  - Accept or decline requests

### 3. Borrower Features
- **Browse Items**: View all available items from nearby lenders
- **Request Item**: Submit borrowing requests with specific dates

### 4. Data Persistence
- All user data, items, and requests are stored in Firebase Firestore
- Real-time data synchronization across the app

## Technologies Used

- **React Native** - Mobile app framework
- **Expo** - Development and build toolchain
- **Firebase Firestore** - Cloud database for storing users, items, and requests
- **Firebase Storage** - Image storage for item photos
- **React Navigation** - Navigation between screens

