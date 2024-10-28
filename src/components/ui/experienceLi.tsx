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
                                <article className="prose dark:prose-invert">
                                    <ul className='list-inside list-disc'>
                                        {entry.tasks.map((i: any) => (
                                            <li key={i}>{i}</li>
                                        ))}
                                    </ul>
                                </article>
                            </li>
                        ))
                    }
                </ul>
            )}
            {slice && experience.slice(0, 3).map((entry: any) => (
                <div key={entry.start}>
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
