const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass


function orderIdMatchesRouteId(req, res, next) {
    const { orderId } = req.params;
    const order = req.body.data;
    if (order.id && orderId !== order.id) {
        return next({ 
            status: 400,
            message: `Order id does not match route id. Order: ${order.id}, Route: ${orderId}`,
         });
    }
    next();
}

function orderIdExists(req, res, next) {
    const { orderId } = req.params;
    const foundIndex = orders.findIndex((order) => order.id === orderId);
    if (foundIndex >= 0) {
        res.locals.foundOrder = { index: foundIndex, order: orders[foundIndex] };
    } else {
        return next({
            status: 404,
            message: `Order does not exist: ${orderId}.`
        });
    }
    next();
}

function bodyExists(req, res, next) {
    const { orderId } = req.params;
    const order = req.body.data;
    const {deliverTo, mobileNumber, dishes} = order;

    if (!deliverTo) {
        return next({
            status: 400, 
            message: 'Order must include a deliverTo',
        });
    }
    if (!mobileNumber) {
        return next({
            status: 400,
            message: 'Order must include a mobileNumber',
        });
    }
    if (!dishes) {
        return next({ 
            status: 400,
            message: 'Order must include a dish',
         });
    }
    if(!Array.isArray(dishes) || dishes.length === 0) {
        return next({
            status: 400,
            message: 'Order must include at least one dish',
        });
    }
    for (let i = 0; i < dishes.length; i++) {
        const dish = dishes[i];
        if (!dish.quantity
            || !Number.isInteger(dish.quantity) ||
            dish.quantity < 0
            ) {
                return next ({
                    status: 400,
                    message: `Dish ${i} must have a quantity that is an integer greater than 0`,
                });
        }
    }
    let handleId = undefined;
    if (req.method === 'POST') {
        handleId = { id: nextId() }
    }
    if (req.method === 'PUT' && !order.id) {
        handleId = { id: orderId }
    }
    const newOrder = { ...order, ...handleId };
    res.locals.newOrder = newOrder;
    next();
}

function statusExists(req, res, next) {
    const validStatus = {
        pending: 'canBeDeleted',
        preparing: 'x',
        outForDelivery: 'x',
        delivered: 'x',
    };
    if (req.method === 'PUT') {
        const order = req.body.data;
        const { status } = order;
        
        if (!validStatus[status]) {
            return next({
                status: 400,
                message: 'Order must have a status of pending, preparing, out-for-delivery, delivered.'
            });
        }
        if (res.locals.foundOrder.order.status === 'delivered') {
            return next({
                status: 400, 
                message: 'A delivery order cannot be changed',
            });
        }
    }
    if (req.method === 'DELETE') {
        if (validStatus[res.locals.foundOrder.order.status] !== 'canBeDeleted') {
            return next({
                status: 400,
                message: 'An order cannot be deleted unless it is pending',
            });
        }
    }
    next();
}

function create(req, res) {
    const { newOrder } = res.locals;
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}

function read(req, res) {
    res.json({ data: res.locals.foundOrder.order });
}

function update(req, res, next) {
    const { order } = res.locals.foundOrder;
    const { newOrder } = res.locals;
    const updatedOrder = { ...order, ...newOrder };
    res.json({ data: updatedOrder });
}

function destroy(req, res) {
    const { index } = res.locals.foundOrder;
    const deletedOrder = orders.splice(index, 1);
    res.sendStatus(204);
}

function list(req, res) {
    res.json({ data: orders })
}

module.exports = {
    create: [bodyExists, create],
    read: [orderIdExists, read],
    update: [orderIdExists, bodyExists, orderIdMatchesRouteId, statusExists, update],
    delete: [orderIdExists, statusExists, destroy],
    list,
}