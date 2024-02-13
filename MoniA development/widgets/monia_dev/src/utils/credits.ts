import mysql from 'mysql2/promise';
import { Response } from 'express';

export function validateNumber(value: string | number, defaultValue: number): number {
  if (value === undefined) {
    return defaultValue;
  } else if (typeof value === 'number') {
    return value;
  } else if (typeof value === 'string') {
    const parsedValue = parseFloat(value);
    return isNaN(parsedValue) ? defaultValue : parsedValue;
  } else {
    throw new Error(`Invalid value: ${value}`);
  }
}

export async function deductCredits(
  userId: string,
  totalTokenCount: number,
  intelligence: number,
  res: Response
): Promise<void> {
  let connection;

  // Try to create the connection to the database
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
    });
  } catch (error) {
    console.error('Error connecting to the database:', error);
    res.write(`data: ${JSON.stringify({ token: "Erreur d'accès à la base" })}\n\n`);
    return;
  }

  // Calculate the cost based on the totalTokenCount and the intelligence
  let costPer500Tokens;
  if (intelligence === 1) {
    costPer500Tokens = 0.05;
  } else {
    costPer500Tokens = 0.005;
  }

  let cost;
  if (totalTokenCount <= 1000) {
    cost = costPer500Tokens;
  } else {
    const extraTokens = totalTokenCount - 1000;
    cost = costPer500Tokens + Math.ceil(extraTokens / 500) * costPer500Tokens;
  }
  console.log('total cout: ', cost);
  // Try to deduct the cost from the user's current credits
  try {
    await connection.execute(
      'UPDATE `yq0g1_comprofiler` SET `cb_marketing_currentcredit` = `cb_marketing_currentcredit` - ? WHERE `user_id` = ?',
      [cost, userId]
    );
  } catch (error) {
    console.error('Error updating the database:', error);
    res.write(`data: ${JSON.stringify({ token: 'Erreur de mise à jour de la base' })}\n\n`);
    return;
  }

  // Close the database connection
  await connection.end();
}
