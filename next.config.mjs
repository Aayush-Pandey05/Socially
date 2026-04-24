/** @type {import('next').NextConfig} */
if (process.platform === "win32") {
  process.env.HOME = process.cwd();
  process.env.USERPROFILE = process.cwd();
}

const nextConfig = {};

export default nextConfig;
