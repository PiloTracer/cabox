import type { Prisma } from '@prisma/client';

function dedupePrimaryFirst(ids: string[], primary: string): string[] {
  const rest = ids.filter((id) => id !== primary);
  return [primary, ...rest];
}

/**
 * Rebuilds ProductCategory and DepartmentProduct rows and updates primary pointers.
 * Call inside a transaction with the same Prisma client / tx.
 */
export async function syncProductCatalogRelations(
  db: Prisma.TransactionClient,
  productId: string,
  input: {
    primaryCategoryId: string;
    primaryDepartmentId: string;
    categoryIds?: string[];
    departmentIds?: string[];
  },
): Promise<void> {
  const categoryIds = dedupePrimaryFirst(
    input.categoryIds?.length ? input.categoryIds : [input.primaryCategoryId],
    input.primaryCategoryId,
  );
  const departmentIds = dedupePrimaryFirst(
    input.departmentIds?.length ? input.departmentIds : [input.primaryDepartmentId],
    input.primaryDepartmentId,
  );

  await db.productCategory.deleteMany({ where: { productId } });
  await db.productCategory.createMany({
    data: categoryIds.map((categoryId, position) => ({
      productId,
      categoryId,
      position,
    })),
  });

  await db.departmentProduct.deleteMany({ where: { productId } });
  await db.departmentProduct.createMany({
    data: departmentIds.map((departmentId, position) => ({
      productId,
      departmentId,
      position,
    })),
  });

  await db.product.update({
    where: { id: productId },
    data: {
      primaryCategoryId: input.primaryCategoryId,
      primaryDepartmentId: input.primaryDepartmentId,
    },
  });
}
