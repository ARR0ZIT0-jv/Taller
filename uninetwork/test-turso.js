const { createClient } = require('@libsql/client');
const client = createClient({ 
  url: 'libsql://uninetwork-arr0zit0-jv.aws-us-east-2.turso.io', 
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJleHAiOjE4MTAyNDU0MDMsImlhdCI6MTc3ODcwOTQwMywiaWQiOiIwMTllMWExMy1kZjAxLTdlYjAtYTVmNi1lOTljNzE1YmYyNGYiLCJyaWQiOiI1YTMzNDMxYi1hYmEwLTQwNjQtOGZhZC1mYTI3NTExNGUxMDIifQ.KUa-RZ41CvQHa8wRodnXBD6NszmgwWrvqCs2F2Hqga4906VzLRecobjtrdODuHZRNT3QeXVeURdErN8JruAQBA' 
});

client.execute("SELECT * FROM users WHERE email='maria@uninetwork.bo'")
  .then(console.log)
  .catch(console.error);
