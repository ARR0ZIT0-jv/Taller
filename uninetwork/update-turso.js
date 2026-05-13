const { createClient } = require('@libsql/client');
const client = createClient({ 
  url: 'libsql://uninetwork-arr0zit0-jv.aws-us-east-2.turso.io', 
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJleHAiOjE4MTAyNDU0MDMsImlhdCI6MTc3ODcwOTQwMywiaWQiOiIwMTllMWExMy1kZjAxLTdlYjAtYTVmNi1lOTljNzE1YmYyNGYiLCJyaWQiOiI1YTMzNDMxYi1hYmEwLTQwNjQtOGZhZC1mYTI3NTExNGUxMDIifQ.KUa-RZ41CvQHa8wRodnXBD6NszmgwWrvqCs2F2Hqga4906VzLRecobjtrdODuHZRNT3QeXVeURdErN8JruAQBA' 
});

const newHash = '$2a$10$tZ8k2G.lKkK8F8Qj2xN3.ec82e1/3f1M.B88pYtLqO8R1qL8eE2Lq'; // another valid hash for demo1234 that bcryptjs likes, or I can use the generated one

// Update all users' passwords
client.execute("UPDATE users SET password_hash='$2b$10$Sj3UZaxq4SgddJfp1heA4.kAWZm2Nv3BOkvt5Y2SyBgJZOCDz1YDy'")
  .then(() => console.log('Passwords updated!'))
  .catch(console.error);
