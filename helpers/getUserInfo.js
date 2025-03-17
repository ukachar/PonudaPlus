import { account } from "../appwriteConfig";

export default async function getUserInfo() {
  try {
    const user = await account.get();
    return user;
  } catch (error) {
    console.error("Dogodila se pogreška: ", error);
  }
}
