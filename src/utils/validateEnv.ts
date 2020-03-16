import {
  cleanEnv, port, str,
} from 'envalid';

function validateEnv() {
  cleanEnv(process.env, {
    APP_ADDRESS: str(),
    JWT_SECRET: str(),
    MONGO_PASSWORD: str(),
    MONGO_PATH: str(),
    MONGO_USER: str(),
    SENDGRID_API_KEY: str(),
    SENDGRID_USER: str(),
    SENDGRID_PASSWORD: str(),
    PORT: port(),
    GEOCODER_API_KEY: str()
  });
}

export default validateEnv;
