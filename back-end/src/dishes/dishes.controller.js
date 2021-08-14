const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function bodyExists(req, res, next) {
    const { dishId } = req.params;
    const dish = req.body.data;
    const { name, description, price, image_url } = dish;
    if (dish.id && dishId !== dish.id) {
        return next({
            status: 400,
            message: `Dish id does not match route id. Dish: ${dish.id}, Route: ${dishId}`,
        });
    }

    if (!dish) {
        return next({
          status: 400,
          message: "Dish is empty",
        });
    }

    if (!name) {
        return next({
          status: 400,
          message: "Dish must include a name",
        });
    }
    
    if (!description) {
        return next({
          status: 400,
          message: "Dish must include a description",
        });
    }
    
    if (!price) {
        return next({
          status: 400,
          message: "Dish must include a price",
        });
    }
    
    if (!Number.isInteger(price) || price < 0) {
        return next({
          status: 400,
          message: "Dish must have a price that is an integer greater than 0",
        });
    }
    
    if (!image_url) {
        return next({
          status: 400,
          message: "Dish must include a image_url",
        });
    }
    
    let handleId = undefined;
      if (dish.id === undefined && dishId) {
        handleId = { id: dishId };
      } else {
        handleId = dishId ? { id: dishId } : { id: nextId() };
      }
    
      const newDish = { ...dish, ...handleId };
      res.locals.newDish = newDish;
      next();
}

function dishIdExists(req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    if (foundDish === undefined) {
        return next({
            status: 404,
            message: `Dish does not exist: ${ dishId }.`,
        });
    }
    res.locals.foundDish = foundDish;
    next();
}

function create(req, res) {
    const { newDish } = res.locals;
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
}

function read(req, res) {
    res.json({ data: res.locals.foundDish })
}

function update(req, res) {
    const { foundDish } = res.locals;
    const { newDish } = res.locals;
    if (newDish.id !== foundDish.id) {
        return next({
            status: 400,
            message: `You can not change existing dish id ${foundDish.id} to ${newDish.id}`,
        });
    }
    const updatedDish = { ...foundDish, ...newDish };
    res.json({ data: updatedDish });
}

function list(req, res) {
    res.json({ data: dishes });
}

module.exports = {
    create: [bodyExists, create],
    read: [dishIdExists, read],
    update: [dishIdExists, bodyExists, update],
    list,
};