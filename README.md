# BookVerse: Smart E-Book Store

BookVerse เป็นเว็บไซต์ร้านค้า E-Book สำหรับซื้อ เช่า ดาวน์โหลด และแนะนำหนังสือตามความสนใจของผู้ใช้ พัฒนาด้วย Nuxt.js และ Vue.js โดยใช้ MongoDB เป็นฐานข้อมูลหลัก เหมาะกับการต่อยอดตามหัวข้อ Smart E-Book Store ในงานวิจัย/วิทยานิพนธ์

## Tech Stack

- Nuxt.js 4 สำหรับ full-stack web application
- Vue.js 3 สำหรับ frontend components และ composables
- Nuxt UI และ Tailwind CSS สำหรับ UI
- MongoDB และ Mongoose สำหรับ database และ data models
- JWT และ bcryptjs สำหรับ authentication
- S3-compatible storage สำหรับไฟล์ PDF และภาพปก
- pdf-lib สำหรับฝัง watermark ในไฟล์ดาวน์โหลด

## Features

- สมัครสมาชิก เข้าสู่ระบบ และเข้าสู่ระบบด้วย Google
- ค้นหา กรอง และจัดเรียงหนังสือ
- ซื้อหรือเช่า E-Book
- ตะกร้าสินค้าและ checkout แบบ mock payment
- สร้าง download token สำหรับหนังสือที่ซื้อ/เช่า
- จำกัดจำนวนครั้งและวันหมดอายุของการดาวน์โหลด
- ฝัง watermark ใน PDF ก่อนดาวน์โหลด
- Wishlist, review, rating และหนังสือแนะนำ
- Admin panel สำหรับเพิ่ม แก้ไข ลบ และอัปโหลดหนังสือ

## Setup

Make sure to install the dependencies:

```bash
npm install
```

Create `.env` and set the required values:

```bash
MONGODB_URI=mongodb://localhost:27017/bookstore
JWT_SECRET=change-this-secret
S3_REGION=ap-southeast-1
S3_BUCKET=bookstore-files
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_ENDPOINT=
GOOGLE_CLIENT_ID=
```

## Development Server

Start MongoDB locally:

```bash
npm run db
```

Then start the development server on `http://localhost:3000`:

```bash
npm run dev
```

## Production

Build the application for production:

```bash
npm run build
```

Locally preview production build:

```bash
npm run preview
```
