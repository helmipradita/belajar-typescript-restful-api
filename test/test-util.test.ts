import {UserTest, ContactTest, AddressTest} from "./test-util";

describe("Test utilities error handling", () => {

    afterEach(async () => {
        await AddressTest.deleteAll();
        await ContactTest.deleteAll();
        await UserTest.delete();
    });

    it("should throw when user not found", async () => {
        await expect(UserTest.get()).rejects.toThrow("User is not found");
    });

    it("should throw when contact not found", async () => {
        await expect(ContactTest.get()).rejects.toThrow("Contact is not found");
    });

    it("should throw when address not found", async () => {
        await expect(AddressTest.get()).rejects.toThrow("Address is not found");
    });

});
