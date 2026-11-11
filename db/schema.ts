import {sqliteTable,text,integer,index} from 'drizzle-orm/sqlite-core';

export const products=sqliteTable('products',{
 id:text('id').primaryKey(),slug:text('slug').notNull().unique(),name:text('name').notNull(),
 priceCents:integer('price_cents').notNull(),categorySlug:text('category_slug').notNull(),
 language:text('language').notNull(),images:text('images').notNull(),description:text('description').notNull(),
 stock:integer('stock').notNull().default(0),sku:text('sku').notNull().default(''),
 status:text('status').notNull().default('draft'),isLive:integer('is_live').notNull().default(0),
 featured:integer('featured').notNull().default(0),version:integer('version').notNull().default(1),
 createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull(),
},t=>[index('products_category_status').on(t.categorySlug,t.status)]);

export const appMeta=sqliteTable('app_meta',{key:text('key').primaryKey(),value:text('value').notNull()});
