import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import Event from "../models/Event.js";
import Booking from "../models/Booking.js";
import Waitlist from "../models/Waitlist.js";
import Ticket from "../models/Ticket.js";
import {
  joinWaitlist,
  allocateSeatIfWaitlistExists,
  processExpiredOffers,
  leaveWaitlist,
  getActiveWaitlistCount,
} from "../services/waitlistService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function runTests() {
  console.log("🧪 ==========================================");
  console.log("🧪 STARTING GATHER ADVANCED WAITLIST TEST SUITE");
  console.log("🧪 ==========================================\n");

  await connectDB();

  let testEvent = null;
  let testUsers = [];

  try {
    // 0. Setup test users and test event
    console.log("1️⃣  Setting up isolated test environment...");
    for (let i = 1; i <= 12; i++) {
      const email = `test_waitlist_user_${i}_${Date.now()}@gather.test`;
      const u = await User.create({
        name: `Test Attendee ${i}`,
        email,
        passwordHash: "dummyhash",
        role: "user",
      });
      testUsers.push(u);
    }

    testEvent = await Event.create({
      title: `Test Exclusive Masterclass ${Date.now()}`,
      slug: `test-waitlist-${Date.now()}`,
      description: "Automated test event for Gather waitlist engine",
      category: "Technology",
      date: "Nov 15, 2026",
      time: "2:00 PM - 5:00 PM IST",
      venue: "Gather Test Lab",
      price: 0,
      totalSeats: 2,
      availableSeats: 2,
      organizerName: "Gather Curator",
      isPublished: true,
    });
    console.log(`   ✓ Created test event: "${testEvent.title}" (Total Seats: 2, Available: 2)`);

    // TEST 1: Cannot join waitlist when seats are still available
    console.log("\n2️⃣  Testing Available Seats Guard (Cannot join waitlist when seats exist)...");
    try {
      await joinWaitlist({
        eventId: testEvent._id,
        userId: testUsers[0]._id,
        attendeeName: testUsers[0].name,
        attendeeEmail: testUsers[0].email,
      });
      throw new Error("FAIL: Should not allow joining waitlist when availableSeats > 0");
    } catch (err) {
      if (err.statusCode === 400 && err.message.includes("Seats are still available")) {
        console.log("   ✓ Correctly rejected waitlist join when seats are available.");
      } else {
        throw err;
      }
    }

    // Now fill the 2 seats to make event sold out
    testEvent.availableSeats = 0;
    await testEvent.save();
    console.log("   ✓ Set event to Sold Out (availableSeats = 0)");

    // TEST 2: Join waitlist for sold out event
    console.log("\n3️⃣  Testing Joining Waitlist for Sold Out Event...");
    const join1 = await joinWaitlist({
      eventId: testEvent._id,
      userId: testUsers[0]._id,
      attendeeName: testUsers[0].name,
      attendeeEmail: testUsers[0].email,
    });
    console.log(`   ✓ User 1 joined waitlist! Status: ${join1.waitlistEntry.status}, Queue Position: #${join1.queuePosition}`);
    if (join1.waitlistEntry.status !== "WAITING" || join1.queuePosition !== 1) {
      throw new Error("FAIL: User 1 should have status WAITING and position 1");
    }

    // TEST 3: Duplicate Entry Guard
    console.log("\n4️⃣  Testing Duplicate Entry Prevention...");
    try {
      await joinWaitlist({
        eventId: testEvent._id,
        userId: testUsers[0]._id,
        attendeeName: testUsers[0].name,
        attendeeEmail: testUsers[0].email,
      });
      throw new Error("FAIL: Should not allow same user to join waitlist twice");
    } catch (err) {
      if (err.statusCode === 409 && err.message.includes("already on the waitlist")) {
        console.log("   ✓ Correctly blocked duplicate waitlist entry.");
      } else {
        throw err;
      }
    }

    // TEST 4: Max 10 Waitlist Capacity Limit
    console.log("\n5️⃣  Testing 10-Person Waitlist Capacity Enforcement...");
    // Add users 2 through 10 (Total 10 users in waitlist)
    for (let i = 1; i < 10; i++) {
      await joinWaitlist({
        eventId: testEvent._id,
        userId: testUsers[i]._id,
        attendeeName: testUsers[i].name,
        attendeeEmail: testUsers[i].email,
      });
    }

    const count10 = await getActiveWaitlistCount(testEvent._id);
    console.log(`   ✓ Active waitlist count reached: ${count10}/10`);
    if (count10 !== 10) {
      throw new Error(`FAIL: Expected 10 active waitlist entries, got ${count10}`);
    }

    // 11th user attempts to join
    try {
      await joinWaitlist({
        eventId: testEvent._id,
        userId: testUsers[10]._id,
        attendeeName: testUsers[10].name,
        attendeeEmail: testUsers[10].email,
      });
      throw new Error("FAIL: 11th user should be rejected when capacity is full");
    } catch (err) {
      if (err.isFull && err.message.includes("maximum 10 attendees")) {
        console.log("   ✓ Correctly blocked 11th attendee: waitlist is strictly capped at 10.");
      } else {
        throw err;
      }
    }

    // TEST 5: Automatic Seat Allocation on Cancellation & FIFO Order
    console.log("\n6️⃣  Testing Automatic FIFO Seat Promotion on Booking Cancellation...");
    // Simulate 1 seat being cancelled/freed
    await Event.findByIdAndUpdate(testEvent._id, { $inc: { availableSeats: 1 } });
    
    // Allocate seat to waitlist
    const promotedEntry = await allocateSeatIfWaitlistExists(testEvent._id);
    console.log(`   ✓ Promoted user: ${promotedEntry.attendeeEmail}, Status: ${promotedEntry.status}`);
    console.log(`   ✓ Unique Offer Token: ${promotedEntry.offerToken.substring(0, 16)}...`);
    console.log(`   ✓ Offer Expires At: ${promotedEntry.offerExpiresAt.toISOString()} (2-hour window)`);

    if (promotedEntry.status !== "OFFERED" || promotedEntry.user.toString() !== testUsers[0]._id.toString()) {
      throw new Error("FAIL: First user (User 1) was not promoted to OFFERED according to FIFO");
    }

    // Verify seat is held and public seats remain 0
    const recheckEvent = await Event.findById(testEvent._id);
    if (recheckEvent.availableSeats !== 0) {
      throw new Error(`FAIL: Held seat should not be visible to public (expected 0, got ${recheckEvent.availableSeats})`);
    }
    console.log("   ✓ Seat is atomically held: public availableSeats remains 0 to prevent general public race condition.");

    // TEST 6: Expired Offer Handling & Passing Seat to Next in Line
    console.log("\n7️⃣  Testing 2-Hour Offer Expiration & Passing to Next Attendee...");
    // Artificially age the offer past the 2-hour window
    promotedEntry.offerExpiresAt = new Date(Date.now() - 5000); // 5 seconds in the past
    await promotedEntry.save();

    // Trigger background expiry processor
    const expiredCount = await processExpiredOffers();
    console.log(`   ✓ Worker processed ${expiredCount} expired offer(s).`);

    const expiredEntry = await Waitlist.findById(promotedEntry._id);
    console.log(`   ✓ User 1 status updated to: ${expiredEntry.status}`);
    if (expiredEntry.status !== "EXPIRED") {
      throw new Error("FAIL: User 1 offer should be marked EXPIRED");
    }

    // Verify User 2 was immediately promoted to OFFERED
    const user2Entry = await Waitlist.findOne({ event: testEvent._id, user: testUsers[1]._id });
    console.log(`   ✓ Next in line (User 2) status is now: ${user2Entry.status}`);
    if (user2Entry.status !== "OFFERED" || !user2Entry.offerToken) {
      throw new Error("FAIL: User 2 was not automatically offered the expired seat");
    }

    // TEST 7: Voluntary Leave
    console.log("\n8️⃣  Testing Voluntary Leave and Immediate Next Promotion...");
    // User 2 declines / leaves waitlist
    await leaveWaitlist({ waitlistId: user2Entry._id, userId: testUsers[1]._id });
    const user2Left = await Waitlist.findById(user2Entry._id);
    console.log(`   ✓ User 2 status after leave: ${user2Left.status}`);
    if (user2Left.status !== "CANCELLED") {
      throw new Error("FAIL: User 2 should be marked CANCELLED");
    }

    // User 3 should now have received the offer!
    const user3Entry = await Waitlist.findOne({ event: testEvent._id, user: testUsers[2]._id });
    console.log(`   ✓ User 3 status is now: ${user3Entry.status}`);
    if (user3Entry.status !== "OFFERED") {
      throw new Error("FAIL: User 3 should have received the offer after User 2 left");
    }

    console.log("\n🎉 ==========================================");
    console.log("🎉 ALL WAITLIST TESTS PASSED SUCCESSFULLY (7/7)");
    console.log("🎉 ==========================================\n");

  } catch (err) {
    console.error("\n❌ TEST FAILED:", err);
    process.exit(1);
  } finally {
    // Cleanup test data
    console.log("🧹 Cleaning up test artifacts from database...");
    if (testEvent) {
      await Waitlist.deleteMany({ event: testEvent._id });
      await Booking.deleteMany({ event: testEvent._id });
      await Ticket.deleteMany({ event: testEvent._id });
      await Event.deleteOne({ _id: testEvent._id });
    }
    if (testUsers.length > 0) {
      const userIds = testUsers.map((u) => u._id);
      await User.deleteMany({ _id: { $in: userIds } });
    }
    console.log("   ✓ Cleaned up test data.");
    await mongoose.connection.close();
    process.exit(0);
  }
}

runTests();
