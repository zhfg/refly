-- CreateEnum
CREATE TYPE "ContentSourceType" AS ENUM ('weblink', 'digest', 'aigc');

-- CreateEnum
CREATE TYPE "ContentMetaType" AS ENUM ('topic', 'entity', 'form');

-- CreateEnum
CREATE TYPE "IndexStatus" AS ENUM ('init', 'processing', 'finish');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('ai', 'human', 'system');

-- CreateTable
CREATE TABLE "accounts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "scope" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_token" (
    "id" SERIAL NOT NULL,
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "verification_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "avatar" TEXT,
    "name" TEXT,
    "email" TEXT,
    "email_verified" TIMESTAMPTZ,
    "password" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "topic_key" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "content_id" INTEGER,
    "title" TEXT NOT NULL,
    "last_message" TEXT NOT NULL DEFAULT '',
    "message_count" INTEGER NOT NULL DEFAULT 0,
    "origin" TEXT NOT NULL DEFAULT '',
    "origin_page_url" TEXT NOT NULL DEFAULT '',
    "origin_page_title" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" SERIAL NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "type" "MessageType" NOT NULL,
    "user_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "sources" TEXT DEFAULT '',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "selected_weblink_config" TEXT,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_weblinks" (
    "id" SERIAL NOT NULL,
    "weblink_id" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "origin" TEXT NOT NULL DEFAULT '',
    "user_id" INTEGER NOT NULL,
    "origin_page_url" TEXT NOT NULL DEFAULT '',
    "origin_page_title" TEXT NOT NULL DEFAULT '',
    "origin_page_description" TEXT NOT NULL DEFAULT '',
    "last_visit_time" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visit_times" INTEGER NOT NULL DEFAULT 0,
    "total_read_time" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_weblinks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weblinks" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "page_content" TEXT NOT NULL,
    "page_meta" TEXT NOT NULL,
    "content_meta" TEXT NOT NULL,
    "index_status" "IndexStatus" NOT NULL DEFAULT 'init',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "weblinks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aigc_contents" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "abstract" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL,
    "meta" TEXT NOT NULL,
    "source_type" "ContentSourceType" NOT NULL,
    "sources" TEXT DEFAULT '',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "weblink_id" INTEGER,
    "input_ids" INTEGER[],
    "output_ids" INTEGER[],

    CONSTRAINT "aigc_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_digests" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "topic_key" TEXT NOT NULL,
    "content_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_digests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_content_graph" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "verification_token_token_key" ON "verification_token"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_token_identifier_token_key" ON "verification_token"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "topics_key_key" ON "topics"("key");

-- CreateIndex
CREATE INDEX "user_preferences_topic_key_idx" ON "user_preferences"("topic_key");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_user_id_topic_key_key" ON "user_preferences"("user_id", "topic_key");

-- CreateIndex
CREATE INDEX "conversations_user_id_updated_at_idx" ON "conversations"("user_id", "updated_at");

-- CreateIndex
CREATE INDEX "chat_messages_conversation_id_idx" ON "chat_messages"("conversation_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_weblinks_user_id_url_key" ON "user_weblinks"("user_id", "url");

-- CreateIndex
CREATE UNIQUE INDEX "weblinks_url_key" ON "weblinks"("url");

-- CreateIndex
CREATE INDEX "aigc_contents_weblink_id_idx" ON "aigc_contents"("weblink_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_digests_content_id_key" ON "user_digests"("content_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_digests_user_id_date_topic_key_key" ON "user_digests"("user_id", "date", "topic_key");

-- CreateIndex
CREATE UNIQUE INDEX "_content_graph_AB_unique" ON "_content_graph"("A", "B");

-- CreateIndex
CREATE INDEX "_content_graph_B_index" ON "_content_graph"("B");

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_topic_key_fkey" FOREIGN KEY ("topic_key") REFERENCES "topics"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aigc_contents" ADD CONSTRAINT "aigc_contents_weblink_id_fkey" FOREIGN KEY ("weblink_id") REFERENCES "weblinks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_digests" ADD CONSTRAINT "user_digests_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "aigc_contents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_content_graph" ADD CONSTRAINT "_content_graph_A_fkey" FOREIGN KEY ("A") REFERENCES "aigc_contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_content_graph" ADD CONSTRAINT "_content_graph_B_fkey" FOREIGN KEY ("B") REFERENCES "aigc_contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
