import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return Response.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    const q = query(
      collection(db, "campaigns"),
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return Response.json({
        keywords: [],
        matchType: "contains",
        replyTemplate: ""
      });
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    return Response.json({
      keywords: data.keywords || [],
      matchType: data.matchType || "contains",
      replyTemplate: data.replyTemplate || ""
    });

  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}