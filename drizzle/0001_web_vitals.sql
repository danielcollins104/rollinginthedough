CREATE TABLE "webVitals" (
	"id" serial PRIMARY KEY NOT NULL,
	"metricId" varchar(64) NOT NULL,
	"name" varchar(16) NOT NULL,
	"value" double precision NOT NULL,
	"rating" varchar(24) NOT NULL,
	"delta" double precision NOT NULL,
	"navigationType" varchar(32) NOT NULL,
	"pathname" varchar(256) NOT NULL,
	"userId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
