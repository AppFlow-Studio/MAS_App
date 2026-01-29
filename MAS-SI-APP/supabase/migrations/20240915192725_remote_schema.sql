do $$
begin
  alter table "auth"."mfa_factors" drop constraint "mfa_factors_phone_key";
  drop index if exists "auth"."mfa_factors_phone_key";
  drop index if exists "auth"."unique_verified_phone_factor";
  CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);
exception
  when insufficient_privilege then
    raise notice 'Skipping auth.mfa_factors changes due to privileges.';
end $$;


create policy "Give users access to own folder 1qy7zhu_0"
on "storage"."objects"
as permissive
for select
to public
using (((bucket_id = 'business_flyers'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));


create policy "Give users access to own folder 1qy7zhu_1"
on "storage"."objects"
as permissive
for insert
to public
with check (((bucket_id = 'business_flyers'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));


create policy "Give users access to own folder 1qy7zhu_2"
on "storage"."objects"
as permissive
for delete
to public
using (((bucket_id = 'business_flyers'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));


create policy "Give users access to own folder 1qy7zhu_3"
on "storage"."objects"
as permissive
for update
to public
using (((bucket_id = 'business_flyers'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));



