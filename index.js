const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

const corsConfig = {
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        "Origin",
        "X-Requested-With",
        "Accept",
        "x-client-key",
        "x-client-token",
        "x-client-secret",
        "Authorization",
    ],
    credentials: true,
};

//middleware
app.use(cors(corsConfig));
app.options("*", cors(corsConfig));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cq8nopc.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        const usersCollection = client.db("skyMartDB").collection("users");
        const productsCollection = client.db("skyMartDB").collection("products");
        const selectedProductCollection = client.db("skyMartDB").collection("selectedProduct");
       


        // store an user to the database
        app.post("/users", async (req, res) => {
            const user = req.body;
            const query = { email: user.email };
            const existingUser = await usersCollection.findOne(query);
            console.log(user);
            if (existingUser) {
                return res.send({ message: "User already exists!" });
            }

            const result = await usersCollection.insertOne(user);
            res.send(result);
        });


        //save selected product
        app.post("/saveProducts", async (req, res) => {
            const selectedProduct = req.body;
            console.log(selectedProduct);
            // check already selected or not ?
            const email = selectedProduct.email;
            const productId = selectedProduct.productId;

            const existingSelection = await selectedProductCollection.findOne({
                email: email,
                "product._id": productId,
            });
            if (existingSelection) {
                // Email has already selected this product
                return res.send({
                    error: "This product has already been selected by the email.",
                });
            }

        
            const result = await selectedProductCollection.insertOne(
                selectedProduct
            );
            res.send(result);
        });
        app.delete('/deleteSelected/:id', async (req, res) => {
            const id = req.params.id;
            const result = await selectedProductCollection.deleteOne({ _id: new ObjectId(id) });
            res.send(result)
        })

        // get selected classes
        app.get("/selectedProducts/:email", async (req, res) => {
            const email = req.params.email;
            console.log(email);
            const selectedProducts = await selectedProductCollection
                .find({ email })
                .toArray();
            res.send(selectedProducts);
        });

        // get all products
        app.get("/products", async (req, res) => {

            const allProducts = await productsCollection.find().toArray();
            res.send(allProducts);
        });
        // get a product
        app.get("/products/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await productsCollection.findOne(query);
            console.log(result);
            res.send(result);
        });

       

        // add a course
        app.post("/api/classes", async (req, res) => {
            const newClass = req.body;
            const result = await classesCollection.insertOne(newClass);
            res.send(result);
        });


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get("/", (req, res) => {
    res.send("Sky Mart Server is Running...");
});

app.listen(port, () => {
    console.log(`Sky Mart Server Running on PORT:  ${port}`);
});