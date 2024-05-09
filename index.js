import express from "express";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

/*
 * Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
 * See https://docs.mongodb.com/ecosystem/drivers/node/ for more details
 
const uri =
  "mongodb+srv://<username>:<password>@<your-cluster-url>/sample_airbnb?retryWrites=true&w=majority";
*/

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    await listDatabases(client);

    // await createListing(client, {
    //   name: "Lovely Loft",
    //   summary: "A charming loft in Paris",
    //   bedrooms: 1,
    //   bathrooms: 1,
    // });

    // await createMultipleListings(client, [
    //   {
    //     name: "Name 1",
    //     summary: "Modern",
    //     property_type: "House",
    //     bedrooms: 5,
    //     bathrooms: 4.5,
    //     beds: 5,
    //   },
    //   {
    //     name: "Name 2",
    //     property_type: "Apartment",
    //     bedrooms: 1,
    //     bathroom: 1,
    //   },
    //   {
    //     name: "Name 3",
    //     summary:
    //       "Enjoy relaxed beach living in this house with a private beach",
    //     bedrooms: 4,
    //     bathrooms: 2.5,
    //     beds: 7,
    //     last_review: new Date(),
    //   },
    // ]);

    //await findOneListingByName(client, "Infinite Views"); //[found]
    //await findOneListingByName(client, "Infews"); //[not found]

    // await findListingsWithMinimumBedroomsBathroomsAndMostRecentReviews(client, {
    //   minimumNumberOfBedrooms: 4,
    //   minimumNumberOfBathrooms: 2,
    //   maximumNumberOfResults: 5,
    // }); // [found]
    // await findListingsWithMinimumBedroomsBathroomsAndMostRecentReviews(client, {
    //   minimumNumberOfBedrooms: 48,
    //   minimumNumberOfBathrooms: 28,
    //   maximumNumberOfResults: 5,
    // }); // [Not found]

    //Find-updateOne-Find
    // await findListingByName(client, "Infinite Views");
    // await updateListingByName(client, "Infinite Views", {
    //   bedrooms: 6,
    //   beds: 8,
    // });
    // await findListingByName(client, "Infinite Views");

    //Find-{not found}-insert-update-find-update-find
    // await findListingByName(client, "Cozy Cottage");
    // await upsertListingByName(client, "Cozy Cottage", {
    //   name: "Cozy Cottage",
    //   bedrooms: 2,
    //   bathrooms: 1,
    // });
    // await findListingByName(client, "Cozy Cottage");
    // await upsertListingByName(client, "Cozy Cottage", { beds: 2 });
    // await findListingByName(client, "Cozy Cottage");

    // UPDATE MANY-Find
    // await updateAllListingsToHavePropertyType(client);
    // await findListingByName(client, "Cozy Cottage");

    // Check-Delete One-Check
    // await printIfListingExists(client, "Cozy Cottage");
    // await deleteListingByName(client, "Cozy Cottage");
    // await printIfListingExists(client, "Cozy Cottage");

    // DELETE MANY
    // await printIfListingExists(client, 2);
    // await deleteListingsScrapedBeforeDate(client, 4.5);
    // await printIfListingExists(client, 2);
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

//MAIN CALL
main()
  .then(() => {
    console.log("> Connected to MongoDB.");
    app.listen(port);
  })
  .catch("> ", console.error);

//LIST DATABASES
async function listDatabases(client) {
  const databasesList = await client.db().admin().listDatabases();
  console.log("> Databases:");
  databasesList.databases.forEach((db) => console.log(` - ${db.name}`));
}

//CREATE ONE
async function createListing(client, newListing) {
  const result = await client
    .db("without")
    .collection("listingsAndReviews")
    .insertOne(newListing);
  console.log(
    `> New listing created with the following id: ${result.insertedId}`
  );
}

//CREATE MULTIPLE
async function createMultipleListings(client, newListings) {
  const result = await client
    .db("without")
    .collection("listingsAndReviews")
    .insertMany(newListings);

  console.log(
    `${result.insertedCount} new listing(s) created with the following id(s):\n`
  );
  console.log(result.insertedIds);
}

//READ ONE
async function findOneListingByName(client, nameOfListing) {
  const result = await client
    .db("without")
    .collection("listingsAndReviews")
    .findOne({ name: nameOfListing });

  if (result) {
    console.log(
      `> Found a listing in the collection with the name '${nameOfListing}':`
    );
    console.log(result);
  } else {
    console.log(`> No listings found with the name '${nameOfListing}'`);
  }
}

//READ ALL
async function findListingsWithMinimumBedroomsBathroomsAndMostRecentReviews(
  client,
  {
    minimumNumberOfBedrooms = 0,
    minimumNumberOfBathrooms = 0,
    maximumNumberOfResults = Number.MAX_SAFE_INTEGER,
  } = {}
) {
  const cursor = client
    .db("without")
    .collection("listingsAndReviews")
    .find({
      bedrooms: { $gte: minimumNumberOfBedrooms },
      bathrooms: { $gte: minimumNumberOfBathrooms },
    })
    .sort({ last_review: -1 })
    .limit(maximumNumberOfResults);

  const results = await cursor.toArray();

  if (results.length > 0) {
    console.log(
      `> Found listing(s) with at least ${minimumNumberOfBedrooms} bedrooms and ${minimumNumberOfBathrooms} bathrooms:`
    );
    results.forEach((result, i) => {
      let date = new Date(result.last_review).toDateString();

      console.log();
      console.log(`${i + 1}. name: ${result.name}`);
      console.log(`   _id: ${result._id}`);
      console.log(`   bedrooms: ${result.bedrooms}`);
      console.log(`   bathrooms: ${result.bathrooms}`);
      console.log(
        `   most recent review date: ${new Date(
          result.last_review
        ).toDateString()}`
      );
    });
  } else {
    console.log(
      `> No listings found with at least ${minimumNumberOfBedrooms} bedrooms and ${minimumNumberOfBathrooms} bathrooms`
    );
  }
}

//UPDATE ONE DOCUMENT
async function updateListingByName(client, nameOfListing, updatedListing) {
  const result = await client
    .db("without")
    .collection("listingsAndReviews")
    .updateOne({ name: nameOfListing }, { $set: updatedListing });

  console.log(
    `> ${result.matchedCount} document(s) matched the query criteria.`
  );
  console.log(`> ${result.modifiedCount} document(s) was/were updated.`);
}

//UPSERT ONE DOCUMENT
async function upsertListingByName(client, nameOfListing, updatedListing) {
  const result = await client
    .db("without")
    .collection("listingsAndReviews")
    .updateOne(
      { name: nameOfListing },
      { $set: updatedListing },
      { upsert: true }
    );
  console.log(
    `> ${result.matchedCount} document(s) matched the query criteria.`
  );

  if (result.upsertedCount > 0) {
    console.log(
      `> One document was inserted with the id ${result.upsertedId._id}`
    );
  } else {
    console.log(`> ${result.modifiedCount} document(s) was/were updated.`);
  }
}

//UPDATE ALL
async function updateAllListingsToHavePropertyType(client) {
  const result = await client
    .db("without")
    .collection("listingsAndReviews")
    .updateMany(
      { property_type: { $exists: false } },
      { $set: { property_type: "Unknown" } }
    );
  console.log(
    `> ${result.matchedCount} document(s) matched the query criteria.`
  );
  console.log(`> ${result.modifiedCount} document(s) was/were updated.`);
}

//FIND
async function findListingByName(client, nameOfListing) {
  const result = await client
    .db("without")
    .collection("listingsAndReviews")
    .findOne({ name: nameOfListing });

  if (result) {
    console.log(
      `> Found a listing in the db with the name '${nameOfListing}':`
    );
    console.log(result);
  } else {
    console.log(`> No listings found with the name '${nameOfListing}'`);
  }
}

//DELETE ONE
async function deleteListingByName(client, nameOfListing) {
  const result = await client
    .db("without")
    .collection("listingsAndReviews")
    .deleteOne({ name: nameOfListing });
  console.log(`> ${result.deletedCount} document(s) was/were deleted.`);
}

//DELETE MULTIPLE
async function deleteListingsScrapedBeforeDate(client, count) {
  const result = await client
    .db("without")
    .collection("listingsAndReviews")
    .deleteMany({ bathrooms: count }); //bathrooms 4.5
  console.log(`> ${result.deletedCount} document(s) was/were deleted.`);
}

//PRINT? {adjusted for deleteMany}
async function printIfListingExists(client, bath) {
  const result = await client
    .db("without")
    .collection("listingsAndReviews")
    .findOne({ bathrooms: { $gte: bath } });

  if (result) {
    if (result.bathrooms) {
      console.log(
        `> Found a listing in the collection with the name 'huhu'. Bathrooms was last scraped ${result.bathrooms}.`
      );
    } else {
      console.log(`> Found a listing in the collection with the name huu'`);
    }
  } else {
    console.log(`> No listings found with the name 'jf'`);
  }
}
