This is a MVC Express Application for my portfolio.
You can find it working [here](https://my-marvel-mvc.herokuapp.com/).

During my work on this project, I have gained advanced knowledge in the following technologies, APIs and modules:
* Node.js
* MongoDB, [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and Mongoose
* Express.js
  * Templating (ejs)
  * Authentication (express-session)
  * Routing
  * Validation and Error handling
* Bootstrap 5
* [Marvel Developer API](https://developer.marvel.com/)
* Nodemailer and [Twilio SendGrid Email API](https://sendgrid.com/)
* Images compression and optimization with [tinify API](https://tinypng.com/)
* AWS and storing images in an [S3 bucket](https://aws.amazon.com/s3/)

Notable app features:
* Fetching data from the Marvel database, characters and comics
* E-mail verification on signup
* Reset password option
* Like and comment on Marvel-themed posts

In order to make it work for you:
* For development - add all neccessary ENV variables to a **nodemon.json** file;
* For production - add all neccessary ENV variables to a **.env** file;

Here is a list of all ENV variables used in this project with hyperlinks to the corresponding documentation:
* [MONGO_USER](https://docs.atlas.mongodb.com/)
* [MONGO_PASSWORD](https://docs.atlas.mongodb.com/)
* MONGO_DATABASE = the name of your database
* [SESSION_SECRET](https://expressjs.com/en/resources/middleware/session.html)
* [MARVEL_API_PRIVATE_KEY](https://developer.marvel.com/documentation/getting_started)
* [MARVEL_API_PUBLIC_KEY](https://developer.marvel.com/documentation/getting_started)
* MARVEL_API_BASE_URL = http://gateway.marvel.com/v1/public/
* [SENDGRID_API_KEY](https://docs.sendgrid.com/for-developers/sending-email/api-getting-started)
* [TINIFY_KEY](https://tinypng.com/developers/reference/nodejs)
* [AWS_BUCKET_NAME](https://aws.amazon.com/s3/getting-started/)
* AWS_BUCKET_REGION
* AWS_ACCESS_KEY_ID
* AWS_SECRET_ACCESS_KEY

And don't forget to **install node_modules**.
