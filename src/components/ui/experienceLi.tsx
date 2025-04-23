import { useEffect, useState } from 'react'
import { EXPERIENCE } from '@/lib/constants'

type ExperienceKey = keyof typeof EXPERIENCE;

interface ExperienceLiProps {
    slice?: boolean;
}

export function ExperienceLi({ slice = false }: ExperienceLiProps) {
    const [lang, setLan] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('language') || 'es';
        }
        return 'es';
    });
    const [experience, setExperience] = useState<any>([]);
    const updateExperience = () => {
        setExperience(EXPERIENCE[lang as ExperienceKey]);
    }

    useEffect(() => {
        updateExperience();
    }, [lang]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const handleLanguageChange = () => {
                updateExperience();
            };
            window.addEventListener('languageChange', () => {
                setLan(localStorage.getItem('language') || 'es');
                updateExperience();
            });
            return () => {
                window.removeEventListener('languageChange', handleLanguageChange);
            };
        }
    }, []);

    return (
        <>
            {!slice && (
                <ul className='w-full'>
                    {
                        experience.map((entry: any) => (
                            <li className="w-full animate mt-4 border-b border-black/10 py-8 first-of-type:mt-0 first-of-type:pt-0 last-of-type:border-none dark:border-white/25" key={entry.start}>
                                <h2 className="mb-4 text-sm uppercase">
                                    {entry.start} - {entry.end}
                                </h2>
                                <a
                                    href={entry.link ?? ''}
                                    className={`font-semibold ${entry?.link ? 'text-primary' : 'text-foreground'}`}
                                >
                                    {entry.company}
                                </a>
                                <div className="text-sm font-semibold py-4">{entry.position}</div>
                                <article>
                                    <ul className="pl-5">
                                        {entry.tasks.map((i: any) => (
                                            <li key={i} className="list-inside list-image-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTQiIGhlaWdodD0iMTIiIHZpZXdCb3g9IjAgMCAxNCAxMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBmaWxsPSIjMzhiZGY4Ij48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xMy42ODUuMTUzYS43NTIuNzUyIDAgMCAxIC4xNDMgMS4wNTJsLTggMTAuNWEuNzUuNzUgMCAwIDEtMS4xMjcuMDc1bC00LjUtNC41YS43NS43NSAwIDAgMSAxLjA2LTEuMDZsMy44OTQgMy44OTMgNy40OC05LjgxN2EuNzUuNzUgMCAwIDEgMS4wNS0uMTQzWiIgLz48L3N2Zz4=')] text-sm text-gray-600 dark:text-gray-400">
                                                {i}
                                            </li>
                                        ))}
                                    </ul>
                                </article>
                            </li>
                        ))
                    }
                </ul>
            )}
            {slice && experience.slice(0, 3).map((entry: any) => (
                <div key={entry.start} className='ml-4'>
                    <h3 className="text-lg font-semibold">{entry.position}</h3>
                    <a className="text-sm text-primary" href={entry?.link ?? ''}>
                        {entry.company}
                    </a>
                    <p className="text-sm text-gray-600">
                        {entry.start} - {entry.end}
                    </p>
                </div>
            ))}
        </>
    )
}
