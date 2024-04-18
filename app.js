const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const _ = require("lodash");
const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

mongoose.connection.once("open", () => console.log("Connected with a database")).on("error", error => {
  console.log("Your Error", error);
});

mongoose.connect(MONGODB_URL);

const itemsSchema = mongoose.Schema({
  name: String
});

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listSchema);

const item1 = new Item({ name: "Welcome to the ToDoList app" });
const item2 = new Item({ name: "Hit the + button to add new task" });
const item3 = new Item({ name: "<-- Hit this Button to Delete your task" });
const defaultTasks = [item1, item2, item3];

app.get("/", async function (req, res) {
  try {
    const foundItems = await Item.find();
    if (foundItems.length === 0) {
      await Item.insertMany(defaultTasks);
      console.log("default data inserted");
      res.redirect("/");
    } else {
      res.render("list", { ListTitle: "Today", newListItems: foundItems });
    }
  } catch (error) {
    console.log(error);
  }
});

app.post("/", async function (req, res) {
  const itemName = req.body.userIn;
  const listName = req.body.list;
  const item = new Item({ name: itemName });
  try {
    if (listName === "Today") {
      await item.save();
      console.log(itemName + " inserted in the list " + listName);
      res.redirect("/");
    } else {
      const foundList = await List.findOne({ name: listName });
      foundList.items.push(item);
      await foundList.save();
      console.log(itemName + " inserted in the list " + listName);
      res.redirect("/" + listName);
    }
  } catch (error) {
    console.log(error);
  }
});

app.get("/:listName", async function (req, res) {
  const customListName = _.capitalize(req.params.listName);
  try {
    const foundList = await List.findOne({ name: customListName });
    if (!foundList) {
      const list = new List({ name: customListName, items: defaultTasks });
      await list.save();
      console.log("saved new List");
      res.redirect("/" + customListName);
    } else {
      res.render("list", { ListTitle: foundList.name, newListItems: foundList.items });
    }
  } catch (error) {
    console.log(error);
  }
});

app.post("/delete", async function (req, res) {
  const checkedItem = req.body.checkbox;
  const listName = req.body.listName;
  try {
    if (listName === "Today") {
      await Item.findByIdAndRemove({ _id: checkedItem });
      console.log(checkedItem + " deleted");
      res.redirect("/")
    } else {
      await List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItem } } });
      res.redirect("/" + listName);
    }
  } catch (error) {
    console.log(error);
  }
});

app.listen(3000, function () {
  console.log("Server is Up...");
});
