import { expect } from "chai";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";

import { createApp } from "../src/app.js";
import {
  connectDatabase,
  disconnectDatabase,
} from "../src/config/database.js";
import { NoteModel } from "../src/models/note.model.js";
import { UserModel } from "../src/models/user.model.js";

interface TestUser {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

type TestAgent = ReturnType<typeof request.agent>;

const alice: TestUser = {
  name: "Alice Writer",
  email: "alice@example.com",
  password: "StrongPassword123!",
  confirmPassword: "StrongPassword123!",
};

const bob: TestUser = {
  name: "Bob Reader",
  email: "bob@example.com",
  password: "StrongPassword123!",
  confirmPassword: "StrongPassword123!",
};

async function registerAgent(
  app: ReturnType<typeof createApp>,
  user: TestUser,
): Promise<{
  agent: TestAgent;
  userId: string;
}> {
  const agent = request.agent(app);
  const response = await agent
    .post("/api/auth/register")
    .send(user);

  expect(response.status).to.equal(201);

  const userId: unknown = response.body.data?.user?.id;

  if (typeof userId !== "string") {
    throw new Error("Registration did not return a user ID.");
  }

  return { agent, userId };
}

async function createNoteFor(
  agent: TestAgent,
  title: string,
  content = "",
): Promise<string> {
  const response = await agent
    .post("/api/notes")
    .send({ title, content });

  expect(response.status).to.equal(201);

  const noteId: unknown = response.body.data?.note?.id;

  if (typeof noteId !== "string") {
    throw new Error("Note creation did not return a note ID.");
  }

  return noteId;
}

describe("Notes API", function () {
  this.timeout(120_000);

  process.env.JWT_SECRET =
    "integration-test-only-secret-that-is-over-32-characters";
  process.env.JWT_TTL_SECONDS = "3600";

  const app = createApp("http://localhost:5173");
  let mongoServer: MongoMemoryServer | undefined;

  before(async () => {
    const testMongoServer = await MongoMemoryServer.create();
    mongoServer = testMongoServer;

    await connectDatabase(
      testMongoServer.getUri("shine_notes_crud_test"),
    );
    await Promise.all([UserModel.init(), NoteModel.init()]);
  });

  beforeEach(async () => {
    await NoteModel.deleteMany({});
    await UserModel.deleteMany({});
  });

  after(async () => {
    await disconnectDatabase();

    if (mongoServer !== undefined) {
      await mongoServer.stop();
    }
  });

  it("protects every notes route", async () => {
    const noteId = new mongoose.Types.ObjectId().toString();
    const responses = await Promise.all([
      request(app)
        .post("/api/notes")
        .send({ title: "Private note", content: "" }),
      request(app).get("/api/notes"),
      request(app).get(`/api/notes/${noteId}`),
      request(app)
        .patch(`/api/notes/${noteId}`)
        .send({ title: "Changed" }),
      request(app).delete(`/api/notes/${noteId}`),
    ]);

    for (const response of responses) {
      expect(response.status).to.equal(401);
      expect(response.body.error.code).to.equal(
        "UNAUTHENTICATED",
      );
    }
  });

  it("creates a note and sanitizes rich-text HTML", async () => {
    const { agent, userId } = await registerAgent(app, alice);
    const dangerousContent = [
      "<h2>Plan</h2>",
      '<p onclick="alert(1)">Hello <strong>world</strong></p>',
      '<a href="javascript:alert(1)">bad link</a>',
      '<a href="//evil.example">relative link</a>',
      '<a href="https://example.com">safe link</a>',
      "<script>alert(1)</script>",
      "<xmp><img src=x onerror=alert(1)></xmp>",
      "<svg><textarea><img src=x onerror=alert(1)>",
      "<math><xmp><img src=x onerror=alert(1)>",
      "<textarea></textarea/><img src=x onerror=alert(1)>",
    ].join("");

    const response = await agent
      .post("/api/notes")
      .send({
        title: "  Launch plan  ",
        content: dangerousContent,
      });

    expect(response.status).to.equal(201);
    expect(response.body.data.note.title).to.equal(
      "Launch plan",
    );

    const content = response.body.data.note.content as string;

    expect(content).to.contain("<strong>world</strong>");
    expect(content).to.contain(
      'href="https://example.com"',
    );
    expect(content).not.to.match(
      /script|javascript:|onclick|onerror|<img|<xmp|<svg|<math|<textarea|href="\/\//i,
    );
    expect(response.body.data.note).not.to.have.property(
      "ownerId",
    );

    const storedNote = await NoteModel.findById(
      response.body.data.note.id,
    ).exec();

    expect(storedNote).not.to.equal(null);
    expect(storedNote?.ownerId.toString()).to.equal(userId);
    expect(storedNote?.content).to.equal(content);
  });

  it("rejects invalid fields and ownership spoofing", async () => {
    const { agent } = await registerAgent(app, alice);
    const fakeOwnerId = new mongoose.Types.ObjectId().toString();

    const blankTitle = await agent
      .post("/api/notes")
      .send({ title: "   ", content: "" });
    const spoofedOwner = await agent
      .post("/api/notes")
      .send({
        title: "Spoofed note",
        content: "",
        ownerId: fakeOwnerId,
      });

    for (const response of [blankTitle, spoofedOwner]) {
      expect(response.status).to.equal(400);
      expect(response.body.error.code).to.equal(
        "VALIDATION_ERROR",
      );
    }

    const expandedContent = await agent
      .post("/api/notes")
      .send({
        title: "Expanded content",
        content: "&".repeat(100_000),
      });

    expect(expandedContent.status).to.equal(400);
    expect(expandedContent.body.error.code).to.equal(
      "VALIDATION_ERROR",
    );

    expect(await NoteModel.countDocuments()).to.equal(0);
  });

  it("lists only the authenticated user's notes", async () => {
    const aliceSession = await registerAgent(app, alice);
    const bobSession = await registerAgent(app, bob);

    const firstAliceNote = await createNoteFor(
      aliceSession.agent,
      "Alice one",
    );
    const secondAliceNote = await createNoteFor(
      aliceSession.agent,
      "Alice two",
    );
    const bobNote = await createNoteFor(
      bobSession.agent,
      "Bob only",
    );

    const response = await aliceSession.agent.get(
      "/api/notes",
    );

    expect(response.status).to.equal(200);
    expect(
      response.body.data.notes.map(
        (note: { id: string }) => note.id,
      ),
    ).to.deep.equal([secondAliceNote, firstAliceNote]);
    expect(JSON.stringify(response.body)).not.to.contain(
      bobNote,
    );
  });

  it("conceals ownership and blocks another user's changes", async () => {
    const aliceSession = await registerAgent(app, alice);
    const bobSession = await registerAgent(app, bob);
    const aliceNoteId = await createNoteFor(
      aliceSession.agent,
      "Alice private",
      "<p>Original</p>",
    );
    const missingNoteId = new mongoose.Types.ObjectId().toString();

    const foreignRead = await bobSession.agent.get(
      `/api/notes/${aliceNoteId}`,
    );
    const missingRead = await bobSession.agent.get(
      `/api/notes/${missingNoteId}`,
    );
    const malformedRead = await bobSession.agent.get(
      "/api/notes/not-an-object-id",
    );
    const foreignUpdate = await bobSession.agent
      .patch(`/api/notes/${aliceNoteId}`)
      .send({ title: "Taken over" });
    const missingUpdate = await bobSession.agent
      .patch(`/api/notes/${missingNoteId}`)
      .send({ title: "Taken over" });
    const foreignDelete = await bobSession.agent.delete(
      `/api/notes/${aliceNoteId}`,
    );
    const missingDelete = await bobSession.agent.delete(
      `/api/notes/${missingNoteId}`,
    );

    for (const response of [
      foreignRead,
      missingRead,
      malformedRead,
      foreignUpdate,
      missingUpdate,
      foreignDelete,
      missingDelete,
    ]) {
      expect(response.status).to.equal(404);
      expect(response.body.error).to.deep.equal({
        code: "NOTE_NOT_FOUND",
        message: "The requested note was not found.",
      });
    }

    const unchangedNote = await NoteModel.findById(
      aliceNoteId,
    ).exec();

    expect(unchangedNote?.title).to.equal("Alice private");
    expect(unchangedNote?.content).to.equal(
      "<p>Original</p>",
    );
  });

  it("lets the owner read, update, and delete a note", async () => {
    const { agent } = await registerAgent(app, alice);
    const noteId = await createNoteFor(
      agent,
      "First title",
      "<p>First version</p>",
    );

    const readResponse = await agent.get(
      `/api/notes/${noteId}`,
    );

    expect(readResponse.status).to.equal(200);
    expect(readResponse.body.data.note.title).to.equal(
      "First title",
    );

    const emptyUpdate = await agent
      .patch(`/api/notes/${noteId}`)
      .send({});

    expect(emptyUpdate.status).to.equal(400);
    expect(emptyUpdate.body.error.code).to.equal(
      "VALIDATION_ERROR",
    );

    const spoofedUpdate = await agent
      .patch(`/api/notes/${noteId}`)
      .send({
        ownerId: new mongoose.Types.ObjectId().toString(),
      });

    expect(spoofedUpdate.status).to.equal(400);
    expect(spoofedUpdate.body.error.code).to.equal(
      "VALIDATION_ERROR",
    );

    const updateResponse = await agent
      .patch(`/api/notes/${noteId}`)
      .send({
        content:
          '<p>Updated <em>content</em></p><img src=x onerror=alert(1)>',
      });

    expect(updateResponse.status).to.equal(200);
    expect(updateResponse.body.data.note.title).to.equal(
      "First title",
    );
    expect(updateResponse.body.data.note.content).to.equal(
      "<p>Updated <em>content</em></p>",
    );

    const deleteResponse = await agent.delete(
      `/api/notes/${noteId}`,
    );

    expect(deleteResponse.status).to.equal(200);
    expect(deleteResponse.body.data.message).to.equal(
      "Note deleted successfully.",
    );
    expect(await NoteModel.findById(noteId)).to.equal(null);
    await agent.get(`/api/notes/${noteId}`).expect(404);
  });
});
