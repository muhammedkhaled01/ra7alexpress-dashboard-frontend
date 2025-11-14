import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageProvider';
import { Input } from './ui/input';

export default function Pagination({ links, onPageChange }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [jumpPage, setJumpPage] = useState('');

  const totalPages = useMemo(() => {
    return links
      .map(link => parseInt(link.label, 10))
      .filter(n => !isNaN(n))
      .reduce((max, n) => Math.max(max, n), 1);
  }, [links]);

  const currentPage = useMemo(() => {
    const activeLink = links.find(link => link.active);
    return activeLink ? parseInt(activeLink.label, 10) : 1;
  }, [links]);

  const filteredLinks = useMemo(() => {
    if (totalPages <= 7) {
      return links.filter(link => !isNaN(parseInt(link.label, 10)) || link.label.includes('Previous') || link.label.includes('Next'));
    }

    const firstPage = 1;
    const lastPage = totalPages;
    const showLeftDots = currentPage > 3;
    const showRightDots = currentPage < totalPages - 2;

    const pageNumbers = [];

    // Always add first page
    pageNumbers.push(firstPage);

    // Add left ellipsis if needed
    if (showLeftDots) {
      pageNumbers.push('...');
    }

    // Add pages around current page
    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);

    for (let i = startPage; i <= endPage; i++) {
      if (i !== firstPage && i !== lastPage) {
        pageNumbers.push(i);
      }
    }

    // Add right ellipsis if needed
    if (showRightDots) {
      pageNumbers.push('...');
    }

    // Always add last page
    pageNumbers.push(lastPage);

    // Convert page numbers to link objects
    const result = [];
    const allLinks = links.filter(link => !isNaN(parseInt(link.label, 10)));

    // Add Previous button if exists
    const prevLink = links.find(link => link.label.includes('Previous'));
    if (prevLink) {
      result.push(prevLink);
    }

    // Add page numbers
    pageNumbers.forEach(page => {
      if (page === '...') {
        result.push({ label: '...', url: null, active: false });
      } else {
        const link = allLinks.find(l => parseInt(l.label, 10) === page);
        if (link) {
          result.push(link);
        }
      }
    });

    // Add Next button if exists
    const nextLink = links.find(link => link.label.includes('Next'));
    if (nextLink) {
      result.push(nextLink);
    }

    return result;
  }, [links, totalPages, currentPage]);

  const handleClick = (link) => {
    if (!link.active && link.url) {
      const params = new URLSearchParams(link.url.split('?')[1]);
      onPageChange(parseInt(params.get('page') || 1));
    }
  };

  const handleJump = () => {
    const p = parseInt(jumpPage, 10);
    if (p >= 1 && p <= totalPages) {
      onPageChange(p);
      setJumpPage('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleJump();
    }
  };

  return (
    <div className={cn(
      "flex overflow-x-auto items-center w-full gap-2 sm:gap-4",
      isArabic ? "flex-row-reverse" : "flex-row",
      "lg:gap-4"
    )}>
      <nav
        className={cn(
          "flex w-full",
          isArabic ? "justify-start" : "justify-end",
          "lg:justify-end"
        )}
        role="navigation"
        aria-label="pagination"
      >
        <ul className={cn(
          "flex flex-row items-center gap-1 sm:gap-2 lg:gap-2",
          isArabic ? "flex-row-reverse" : "flex-row"
        )}>
          {filteredLinks.map((link, index) => (
            <li key={index}>
              <PaginationItem link={link} onClick={() => handleClick(link)} isArabic={isArabic} />
            </li>
          ))}
        </ul>
      </nav>

      {totalPages > 1 && (
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-2">
          <Input
            type="number"
            min="1"
            max={totalPages}
            value={jumpPage}
            onChange={(e) => setJumpPage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`1–${totalPages}`}
            className={cn(
              "h-8 w-16 rounded border px-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary",
              "sm:h-9 sm:w-20 sm:px-2 sm:text-sm",
              "lg:h-10 lg:w-24 lg:px-3 lg:text-base"
            )}
            aria-label={t('Page number')}
          />
          <button
            onClick={handleJump}
            disabled={!jumpPage}
            className={cn(
              "h-8 px-2 rounded text-xs font-medium transition-colors",
              "sm:h-9 sm:px-3 sm:text-sm",
              "lg:h-10 lg:px-4 lg:text-base",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "disabled:opacity-50 disabled:pointer-events-none"
            )}
          >
            {t('Go')}
          </button>
        </div>
      )}
    </div>
  );
}

function PaginationItem({ link, onClick, isArabic }) {
  const { t } = useTranslation();

  if (link.label.includes('Previous')) {
    return (
      <PaginationLink onClick={onClick} disabled={!link.url}>
        {isArabic ? (
          <>
            <span className="mr-2">{t("Previous")}</span>
            <ChevronLeft className="h-4 w-4" />
          </>
        ) : (
          <>
            <ChevronLeft className="h-4 w-4" />
            <span className="ml-2">{t("Previous")}</span>
          </>
        )}
      </PaginationLink>
    );
  }

  if (link.label.includes('Next')) {
    return (
      <PaginationLink onClick={onClick} disabled={!link.url}>
        {isArabic ? (
          <>
            <ChevronRight className="h-4 w-4" />
            <span className="ml-2">{t("Next")}</span>
          </>
        ) : (
          <>
            <span className="mr-2">{t("Next")}</span>
            <ChevronRight className="h-4 w-4" />
          </>
        )}
      </PaginationLink>
    );
  }

  if (link.label.includes('...')) {
    return <PaginationEllipsis />;
  }

  return (
    <PaginationLink onClick={onClick} isActive={link.active}>
      {link.label}
    </PaginationLink>
  );
}

function PaginationLink({ children, isActive, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        "h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm lg:h-10 lg:px-4 lg:text-base",
        "min-w-[2rem]",
        (isActive
          ? "bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
          : "hover:bg-accent hover:text-accent-foreground")
      )}
    >
      {children}
    </button>
  );
}

function PaginationEllipsis() {
  const { t } = useTranslation();

  return (
    <span className="flex h-9 w-9 items-center justify-center">
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">{t('More pages')}</span>
    </span>
  );
}