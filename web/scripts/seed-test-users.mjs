import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

const DEFAULT_DOMAIN = "campuslog.test";
const DEFAULT_COUNT = 9;
const DEFAULT_PASSWORD_PREFIX = "test";

function loadEnvFile(path) {
  if (!existsSync(path)) {
    return;
  }

  const contents = readFileSync(path, "utf8");

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] ??= value;
  }
}

function readArg(name, fallback) {
  const prefix = `--${name}=`;
  const value = process.argv.find((arg) => arg.startsWith(prefix));

  return value ? value.slice(prefix.length) : fallback;
}

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

async function findUserByEmail(supabase, email) {
  const perPage = 1000;

  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw error;
    }

    const user = data.users.find(
      (candidate) => candidate.email?.toLowerCase() === email.toLowerCase(),
    );

    if (user) {
      return user;
    }

    if (data.users.length < perPage) {
      return null;
    }
  }

  throw new Error("Too many auth users to scan. Narrow this script before running.");
}

function createCampusLogProfile(index) {
  return {
    version: 1,
    fullName: `테스트 사용자 ${index}`,
    nickname: `test${index}`,
    completedAt: new Date().toISOString(),
  };
}

async function upsertTestUser(supabase, index, domain, passwordPrefix) {
  const email = `test${index}@${domain}`;
  const password = `${passwordPrefix}${index}${index}${index}${index}`;
  const userMetadata = {
    campuslog_profile: createCampusLogProfile(index),
  };
  const existingUser = await findUserByEmail(supabase, email);

  if (existingUser) {
    const { data, error } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      {
        email,
        password,
        email_confirm: true,
        user_metadata: {
          ...existingUser.user_metadata,
          ...userMetadata,
        },
      },
    );

    if (error) {
      throw error;
    }

    return { status: "updated", email, password, userId: data.user.id };
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: userMetadata,
  });

  if (error) {
    throw error;
  }

  return { status: "created", email, password, userId: data.user.id };
}

async function main() {
  loadEnvFile(resolve(process.cwd(), ".env.local"));
  loadEnvFile(resolve(process.cwd(), ".env"));

  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const domain = readArg("domain", process.env.TEST_USER_EMAIL_DOMAIN ?? DEFAULT_DOMAIN);
  const count = Number.parseInt(readArg("count", String(DEFAULT_COUNT)), 10);
  const passwordPrefix = readArg(
    "password-prefix",
    process.env.TEST_USER_PASSWORD_PREFIX ?? DEFAULT_PASSWORD_PREFIX,
  );

  if (!Number.isInteger(count) || count < 1 || count > 99) {
    throw new Error("--count must be an integer from 1 to 99.");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const results = [];

  for (let index = 1; index <= count; index += 1) {
    results.push(await upsertTestUser(supabase, index, domain, passwordPrefix));
  }

  console.table(
    results.map(({ status, email, password }) => ({
      status,
      email,
      password,
    })),
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
