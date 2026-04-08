import {prismaClient} from "../src/application/database";
import bcrypt from "bcrypt";
import {Address, Contact, User} from "@prisma/client";

/**
 * Master cleanup function - deletes all test data in correct order
 * to avoid foreign key constraint violations
 */
export async function cleanupTestData() {
    // Delete in reverse dependency order: addresses -> contacts -> users
    await prismaClient.address.deleteMany({
        where: {
            contact: {
                username: "test"
            }
        }
    });
    await prismaClient.contact.deleteMany({
        where: {
            username: "test"
        }
    });
    await prismaClient.user.deleteMany({
        where: {
            username: "test"
        }
    });
}

export class UserTest {

    static async delete() {
        // Use master cleanup for proper ordering
        await cleanupTestData();
    }

    static async create() {
        // Use upsert to handle both create and update scenarios
        // This avoids unique constraint violations when the user already exists
        await prismaClient.user.upsert({
            where: {
                username: "test"
            },
            update: {
                name: "test",
                password: await bcrypt.hash("test", 10),
                token: "test"
            },
            create: {
                username: "test",
                name: "test",
                password: await bcrypt.hash("test", 10),
                token: "test"
            }
        });
    }

    static async get(): Promise<User> {
        const user = await prismaClient.user.findFirst({
            where: {
                username: "test"
            }
        })

        if (!user) {
            throw new Error("User is not found");
        }

        return user;
    }

}

export class ContactTest {

    static async deleteAll() {
        // Delete addresses first due to foreign key constraint
        await prismaClient.address.deleteMany({
            where: {
                contact: {
                    username: "test"
                }
            }
        });
        await prismaClient.contact.deleteMany({
            where: {
                username: "test"
            }
        })
    }

    static async create() {
        // Ensure user exists first
        await UserTest.create();

        // Delete any existing contacts to avoid unique constraint issues
        await prismaClient.contact.deleteMany({
            where: {
                username: "test",
                email: "test@example.com"
            }
        });

        // Create the contact
        await prismaClient.contact.create({
            data: {
                first_name: "test",
                last_name: "test",
                email: "test@example.com",
                phone: "08999999",
                username: "test"
            }
        });
    }

    static async get(): Promise<Contact> {
        const contact = await prismaClient.contact.findFirst({
            where: {
                username: "test"
            }
        });

        if (!contact) {
            throw new Error("Contact is not found");
        }

        return contact;
    }

}

export class AddressTest {

    static async deleteAll() {
        await prismaClient.address.deleteMany({
            where: {
                contact: {
                    username: "test"
                }
            }
        })
    }

    static async create() {
        // Delete any existing addresses for this contact to avoid duplicate issues
        await prismaClient.address.deleteMany({
            where: {
                contact: {
                    username: "test"
                }
            }
        });

        const contact = await ContactTest.get();
        await prismaClient.address.create({
            data: {
                contact_id: contact.id,
                street: "Jalan test",
                city: "Kota test",
                province: "Provinsi test",
                country: "Indonesia",
                postal_code: "11111"
            }
        })
    }

    static async get(): Promise<Address> {
        const address = await prismaClient.address.findFirst({
            where: {
                contact: {
                    username: "test"
                }
            }
        });

        if (!address) {
            throw new Error("Address is not found")
        }

        return address;
    }

}
