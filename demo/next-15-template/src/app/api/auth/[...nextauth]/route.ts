import { handlers } from '@/auth';

if (!handlers || (!handlers.GET && !handlers.POST)) {
    throw new Error(
        'NextAuth handlers missing — ensure auth is initialized and NEXTAUTH_SECRET is set',
    );
}

export const { GET, POST } = handlers;
