# MongoPop

Wednesday, 22 February 2017.

## Alternate UIs

**Not for production**

A web tool to populate a [MongoDB Atlas](https://cloud.mongo.com) instance with sample data (fetches datasets from [Mockaroo](https://www.mockaroo.com)).

Includes:

- Express Restful API
- Angular2 web client
- MongoDB Node.js driver use
- Connections to MongoDB Atlas

## Usage

```bash
git clone git@github.com:am-MongoDB/MongoDB-Mongopop.git
cd MongoDB-Mongopop
npm install
npm run tsc:w
npm run express
```

Browse to `http://localhost:3000/` (or to the IP address or hostname specified in `public/app/app.component.ts`) to use the *Angular2* client.

Browse to `http://localhost:3000/react` (or to the IP address or hostname specified in `public/app/app.component.ts`) to use the *ReactJS* client.

## To be completed

* Add Amazon Alexa client?
* Consider AWS Lambda?
* Consider iOS Workflow?