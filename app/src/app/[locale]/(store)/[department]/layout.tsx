import { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { getDepartmentBySlug } from '@/lib/departments';
import { sanitizeThemeJson, renderDepartmentThemeStyles } from '@/lib/theme';

interface Props {
  children: ReactNode;
  params: Promise<{ department: string }>;
}

export default async function DepartmentShellLayout({ children, params }: Props) {
  const { department } = await params;
  const dept = await getDepartmentBySlug(department);
  if (!dept) notFound();

  const theme = sanitizeThemeJson(dept.theme);
  const safe = dept.slug.replace(/[^a-z0-9-]/gi, '');
  const css = renderDepartmentThemeStyles(safe, theme);

  return (
    <>
      {css ? (
        <style dangerouslySetInnerHTML={{ __html: css }} />
      ) : null}
      <div className={`theme-dept-${safe}`}>{children}</div>
    </>
  );
}
