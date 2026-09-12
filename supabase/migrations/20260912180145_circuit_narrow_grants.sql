-- Ce projet n'a pas d'utilisateurs connectés : seul le rôle anonyme, celui de
-- la clé publiable détenue par la fonction Vercel, a besoin d'appeler ces
-- fonctions. Elles restent sans effet sans le secret serveur.
revoke execute on function public.circuit_board(text, integer) from authenticated;
revoke execute on function public.circuit_submit(text, text, text, text, integer, integer[], text, text, integer) from authenticated;
revoke execute on function public.circuit_hit(text, text, integer) from authenticated;
revoke execute on function public.circuit_reject(text, text, text, text, bigint) from authenticated;
revoke execute on function public.circuit_remove(text, text) from authenticated;
