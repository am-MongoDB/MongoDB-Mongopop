# MongoPop

3rd January 2017

A web tool to populate a [MongoDB Atlas](https://cloud.mongo.com) instance with sample data (fetches datasets from [Mockaroo](https://www.mockaroo.com)).

## Usage

```bash
mkdir mongopop
git clone https://github.com/andrewjamesmorgan/mongopop.git
cd mongopop
npm run install-all
npm run tsc:w
npm run express
```

Browse to `http://localhost:3000/` (or to the IP address or hostname specified in `public/app/app.component.ts`).

