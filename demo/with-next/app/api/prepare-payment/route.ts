import { generateReferenceId } from "@worldcoin/minikit-js";
import { NextRequest, NextResponse } from "next/server";

export const GET = (req: NextRequest) => {
  const reference = generateReferenceId();
  console.log(reference);
  // Save this reference ID in the DB to compare the return result to
  // ...
  return NextResponse.json({
    status: 200,
    body: {
      referenceId: reference,
    },
  });
};
