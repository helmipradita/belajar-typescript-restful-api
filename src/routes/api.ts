import express from "express";
import {authMiddleware} from "../middleware/auth-middleware";
import {apiLimiter} from "../middleware/rate-limit-middleware";
import {UserController} from "../controllers/user-controller";
import {ContactController} from "../controllers/contact-controller";
import {AddressController} from "../controllers/address-controller";

export const apiRouter = express.Router();
apiRouter.use(authMiddleware);
apiRouter.use(apiLimiter);

// User API
apiRouter.get("/users/current", UserController.get);
apiRouter.patch("/users/current", UserController.update);
apiRouter.delete("/users/current", UserController.logout);

// Contact API
apiRouter.post("/contacts", ContactController.create);
apiRouter.get("/contacts/:contactId(\\d+)", ContactController.get);
apiRouter.put("/contacts/:contactId(\\d+)", ContactController.update);
apiRouter.delete("/contacts/:contactId(\\d+)", ContactController.remove);
apiRouter.get("/contacts", ContactController.search);

// Address API
apiRouter.post("/contacts/:contactId(\\d+)/addresses", AddressController.create);
apiRouter.get("/contacts/:contactId(\\d+)/addresses/:addressId(\\d+)", AddressController.get);
apiRouter.put("/contacts/:contactId(\\d+)/addresses/:addressId(\\d+)", AddressController.update);
apiRouter.delete("/contacts/:contactId(\\d+)/addresses/:addressId(\\d+)", AddressController.remove);
apiRouter.get("/contacts/:contactId(\\d+)/addresses", AddressController.list);
