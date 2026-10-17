create or replace function public.localize_supplier_catalog_text(p_text text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  value text := coalesce(p_text, '');
begin
  value := regexp_replace(value, '\mGmail Accounts\M', 'Contas Gmail', 'gi');
  value := regexp_replace(value, '\mGmail Account\M', 'Conta Gmail', 'gi');
  value := regexp_replace(value, '\mGoogle Voice Accounts\M', 'Contas Google Voice', 'gi');
  value := regexp_replace(value, '\mGoogle Voice Account\M', 'Conta Google Voice', 'gi');
  value := regexp_replace(value, '\mGoogle Ads Accounts\M', 'Contas Google Ads', 'gi');
  value := regexp_replace(value, '\mGoogle Ads Account\M', 'Conta Google Ads', 'gi');
  value := regexp_replace(value, '\mGoogle Accounts\M', 'Contas Google', 'gi');
  value := regexp_replace(value, '\mGoogle Account\M', 'Conta Google', 'gi');
  value := regexp_replace(value, '\m(Facebook|Instagram|TikTok|Twitter|Discord|Reddit|LinkedIn|Twitch|Yandex) Accounts\M', 'Contas \1', 'gi');
  value := regexp_replace(value, '\m(Facebook|Instagram|TikTok|Twitter|Discord|Reddit|LinkedIn|Twitch|Yandex) Account\M', 'Conta \1', 'gi');
  value := regexp_replace(value, '\mEmail Accounts?\M', 'Contas de e-mail', 'gi');
  value := regexp_replace(value, '\mAI Accounts?\M', 'Contas de IA', 'gi');
  value := regexp_replace(value, '\mBusiness Center\M', 'Central de Negócios', 'gi');
  value := regexp_replace(value, '\mBusiness Manager\M', 'Gerenciador de Negócios', 'gi');
  value := regexp_replace(value, '\mAd Accounts?\M', 'Contas de anúncios', 'gi');
  value := regexp_replace(value, '\mRecovery Email\M', 'E-mail de recuperação', 'gi');
  value := regexp_replace(value, '\mVerified Email\M|\mEmail Verified\M', 'E-mail verificado', 'gi');
  value := regexp_replace(value, '\mEmail Included\M|\mMail Included\M', 'E-mail incluído', 'gi');
  value := regexp_replace(value, '\mNot Included\M', 'Não incluído', 'gi');
  value := regexp_replace(value, '\mNo Access\M', 'Sem acesso', 'gi');
  value := regexp_replace(value, '\mNo Warranty\M', 'Sem garantia', 'gi');
  value := regexp_replace(value, '\mWithout VAT\M|\mNo VAT\M', 'Sem IVA', 'gi');
  value := regexp_replace(value, '\mAre Not Used\M', 'Não utilizados', 'gi');
  value := regexp_replace(value, '\mNot Used\M', 'Não utilizado', 'gi');
  value := regexp_replace(value, '\mUsed for Ads\M', 'Usada para anúncios', 'gi');
  value := regexp_replace(value, '\mPayment Method Not Added\M', 'Forma de pagamento não adicionada', 'gi');
  value := regexp_replace(value, '\mMay Require\M|\mMight Require\M', 'Pode exigir', 'gi');
  value := regexp_replace(value, '\mCan Receive\M', 'Pode receber', 'gi');
  value := regexp_replace(value, '\mNo Replacement Available\M', 'Sem reposição disponível', 'gi');
  value := regexp_replace(value, '\mNo Replacement\M', 'Sem reposição', 'gi');
  value := regexp_replace(value, '\mTest Carefully\M', 'Teste com cuidado', 'gi');
  value := regexp_replace(value, '\mFor Google Sign-in Only\M|\mFor Google Sing-in Only\M', 'Somente para login no Google', 'gi');
  value := regexp_replace(value, '\mNot a Full Google Account\M|\mNot Google Account\M', 'Não é uma conta Google completa', 'gi');
  value := regexp_replace(value, '\mWorking For\M', 'Funciona por', 'gi');
  value := regexp_replace(value, '\mPersonal/Business\M', 'Pessoal/Empresarial', 'gi');
  value := regexp_replace(value, '\mPrepaid/Postpaid\M', 'Pré-paga/Pós-paga', 'gi');
  value := regexp_replace(value, '\mBackup Email\M', 'E-mail alternativo', 'gi');
  value := regexp_replace(value, '\mRecovery Mail\M', 'E-mail de recuperação', 'gi');
  value := regexp_replace(value, '\mInbox Emails\M', 'E-mails na caixa de entrada', 'gi');
  value := regexp_replace(value, '\mApp Passwords\M', 'Senhas de aplicativo', 'gi');
  value := regexp_replace(value, '\mNo Videos?\M', 'Sem vídeos', 'gi');
  value := regexp_replace(value, '\mOld Videos?\M', 'Vídeos antigos', 'gi');
  value := regexp_replace(value, '\mAutomatic Payments?\M|\mAutomatic Pay\M', 'Pagamento automático', 'gi');
  value := regexp_replace(value, '\mManual Registration\M', 'Cadastro manual', 'gi');
  value := regexp_replace(value, '\mLong-Term Access\M', 'Acesso de longo prazo', 'gi');
  value := regexp_replace(value, '\mReady to Use\M', 'Pronta para uso', 'gi');
  value := regexp_replace(value, '\mFully Activated\M', 'Totalmente ativada', 'gi');
  value := regexp_replace(value, '\mProfile is Filled\M', 'Perfil preenchido', 'gi');
  value := regexp_replace(value, '\mEnabled\M', 'Ativada', 'gi');
  value := regexp_replace(value, '\mLocked\M', 'Bloqueada', 'gi');
  value := regexp_replace(value, '\mNew\M', 'Nova', 'gi');
  value := regexp_replace(value, '\mOld\M', 'Antiga', 'gi');
  value := regexp_replace(value, '\mRegistration\M', 'Cadastro', 'gi');
  value := regexp_replace(value, '\mDomains\M', 'Domínios', 'gi');
  value := regexp_replace(value, '\mOrder\M', 'Pedido', 'gi');
  value := regexp_replace(value, '\mReplacement\M', 'Reposição', 'gi');
  value := regexp_replace(value, '\mAvailable\M', 'Disponível', 'gi');
  value := regexp_replace(value, '\mManually\M', 'Manualmente', 'gi');
  value := regexp_replace(value, '\mMany\M', 'Vários', 'gi');
  value := regexp_replace(value, '\mLanguage\M', 'Idioma', 'gi');
  value := regexp_replace(value, '\mViews\M', 'Visualizações', 'gi');
  value := regexp_replace(value, '\mVideos?\M', 'Vídeo', 'gi');
  value := regexp_replace(value, '\mSpain\M', 'Espanha', 'gi');
  value := regexp_replace(value, '\mPoland\M', 'Polônia', 'gi');
  value := regexp_replace(value, '\mUkraine\M', 'Ucrânia', 'gi');
  value := regexp_replace(value, '\mFrance\M', 'França', 'gi');
  value := regexp_replace(value, '\mPhone Removed\M', 'Telefone removido', 'gi');
  value := regexp_replace(value, '\mUnverified Email\M', 'E-mail não verificado', 'gi');
  value := regexp_replace(value, '\mReinstated\M', 'Restabelecida', 'gi');
  value := regexp_replace(value, '\mWarmed Up\M', 'Aquecida', 'gi');
  value := regexp_replace(value, '\mFarmed\M', 'Preparada', 'gi');
  value := regexp_replace(value, '\mAged\M', 'Antiga', 'gi');
  value := regexp_replace(value, '\mRegistered\M', 'Registrada', 'gi');
  value := regexp_replace(value, '\mCreated\M', 'Criada', 'gi');
  value := regexp_replace(value, '\mAccounts\M', 'Contas', 'gi');
  value := regexp_replace(value, '\mAccount\M', 'Conta', 'gi');
  value := regexp_replace(value, '\mYears\M', 'Anos', 'gi');
  value := regexp_replace(value, '\mYear\M', 'Ano', 'gi');
  value := regexp_replace(value, '\mMonths\M', 'Meses', 'gi');
  value := regexp_replace(value, '\mMonth\M', 'Mês', 'gi');
  value := regexp_replace(value, '\mDays\M', 'Dias', 'gi');
  value := regexp_replace(value, '\mDay\M', 'Dia', 'gi');
  value := regexp_replace(value, '\mFriends\M', 'Amigos', 'gi');
  value := regexp_replace(value, '\mFollowers\M', 'Seguidores', 'gi');
  value := regexp_replace(value, '\mPosts\M', 'Publicações', 'gi');
  value := regexp_replace(value, '\mGender\M', 'Gênero', 'gi');
  value := regexp_replace(value, '\mFemale\M', 'Feminino', 'gi');
  value := regexp_replace(value, '\mMale\M', 'Masculino', 'gi');
  value := regexp_replace(value, '\mRandom\M', 'Aleatório', 'gi');
  value := regexp_replace(value, '\mMixed\M|\mMix\M', 'Misto', 'gi');
  value := regexp_replace(value, '\mWorldwide\M', 'Mundial', 'gi');
  value := regexp_replace(value, '\mCurrency\M', 'Moeda', 'gi');
  value := regexp_replace(value, '\mPassword\M', 'Senha', 'gi');
  value := regexp_replace(value, '\mPhone\M', 'Telefone', 'gi');
  value := regexp_replace(value, '\mAnd\M', 'E', 'gi');
  value := regexp_replace(value, '\mFrom\M', 'De', 'gi');
  value := regexp_replace(value, '\mFor\M', 'Para', 'gi');
  value := regexp_replace(value, '\mOther\M', 'Outros', 'gi');
  value := regexp_replace(value, '[[:space:]]+', ' ', 'g');
  return trim(value);
end;
$$;

update public.products
set data = jsonb_set(
  jsonb_set(
    jsonb_set(data, '{title}', to_jsonb(public.localize_supplier_catalog_text(data->>'title')), true),
    '{tagline}', to_jsonb(public.localize_supplier_catalog_text(data->>'tagline')), true
  ),
  '{description}', to_jsonb(public.localize_supplier_catalog_text(data->>'description')), true
)
where supplier = 'nppr';

update public.products
set data = jsonb_set(
  jsonb_set(
    data,
    '{tags}',
    coalesce((select jsonb_agg(public.localize_supplier_catalog_text(tag)) from jsonb_array_elements_text(coalesce(data->'tags', '[]'::jsonb)) item(tag)), '[]'::jsonb),
    true
  ),
  '{features}',
  coalesce((select jsonb_agg(public.localize_supplier_catalog_text(feature)) from jsonb_array_elements_text(coalesce(data->'features', '[]'::jsonb)) item(feature)), '[]'::jsonb),
  true
)
where supplier = 'nppr';

update public.collections
set data = jsonb_set(
  jsonb_set(data, '{name}', to_jsonb(public.localize_supplier_catalog_text(data->>'name')), true),
  '{description}', to_jsonb(public.localize_supplier_catalog_text(data->>'description')), true
)
where supplier = 'nppr';

update public.products
set data = jsonb_set(data, '{subcategory}', to_jsonb(
  case
    when lower(data->>'supplierCategory') like '%google%' and lower(data->>'title') ~ '(google ads|adwords|adsense|conta de anúncios)' then 'Google Ads'
    when lower(data->>'supplierCategory') like '%google%' and lower(data->>'title') like '%google voice%' then 'Google Voice'
    when lower(data->>'supplierCategory') like '%google%' and lower(data->>'title') like '%youtube%' then 'YouTube'
    when lower(data->>'supplierCategory') like '%google%' and lower(data->>'title') ~ '(gmail|google mail)' then 'Gmail'
    when lower(data->>'supplierCategory') like '%google%' then 'Outros produtos Google'
    when lower(data->>'supplierCategory') like '%email%' and lower(data->>'title') like '%gmail%' then 'Gmail'
    when lower(data->>'supplierCategory') like '%email%' and lower(data->>'title') ~ '(outlook|hotmail|microsoft)' then 'Outlook & Hotmail'
    when lower(data->>'supplierCategory') like '%email%' and lower(data->>'title') like '%proton%' then 'Proton Mail'
    when lower(data->>'supplierCategory') like '%email%' and lower(data->>'title') like '%yahoo%' then 'Yahoo Mail'
    when lower(data->>'supplierCategory') like '%email%' and lower(data->>'title') like '%mail.com%' then 'Mail.com'
    when lower(data->>'supplierCategory') like '%email%' and lower(data->>'title') like '%firstmail%' then 'Firstmail'
    when lower(data->>'supplierCategory') like '%email%' then 'Outros provedores'
    when lower(data->>'supplierCategory') like '%facebook%' and lower(data->>'title') ~ '(business|conta de anúncios|facebook ads)' then 'Anúncios & Empresas'
    when lower(data->>'supplierCategory') like '%facebook%' and lower(data->>'title') like '%marketplace%' then 'Marketplace'
    when lower(data->>'supplierCategory') like '%facebook%' and lower(data->>'title') ~ '(page|fanpage)' then 'Páginas'
    when lower(data->>'supplierCategory') like '%facebook%' then 'Contas do Facebook'
    when lower(data->>'supplierCategory') like '%tiktok%' and lower(data->>'title') ~ '(tiktok ads|business|conta de anúncios)' then 'TikTok Ads'
    when lower(data->>'supplierCategory') like '%tiktok%' and lower(data->>'title') like '%shop%' then 'TikTok Shop'
    when lower(data->>'supplierCategory') like '%tiktok%' then 'Contas do TikTok'
    when lower(data->>'supplierCategory') like '%instagram%' and lower(data->>'title') like '%threads%' then 'Threads'
    when lower(data->>'supplierCategory') like '%instagram%' then 'Contas do Instagram'
    when lower(data->>'supplierCategory') ~ '(twitter|x.com)' then 'Contas do X (Twitter)'
    when lower(data->>'supplierCategory') like '%discord%' and lower(data->>'title') like '%token%' then 'Contas com Token'
    when lower(data->>'supplierCategory') like '%discord%' then 'Contas do Discord'
    when lower(data->>'supplierCategory') like '%reddit%' and lower(data->>'title') like '%karma%' then 'Contas com Karma'
    when lower(data->>'supplierCategory') like '%reddit%' then 'Contas do Reddit'
    else coalesce(nullif(data->>'subcategory', ''), 'Outros produtos')
  end
), true)
where supplier = 'nppr';

do $$
declare
  routine record;
  definition text;
begin
  for routine in
    select p.oid
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('create_order', 'create_wallet_order')
  loop
    definition := pg_get_functiondef(routine.oid);
    definition := replace(definition, 'least(99,', 'least(10000,');
    execute definition;
  end loop;
end;
$$;

create or replace function public.validate_order_item_quantities()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  product_data jsonb;
  requested integer;
  minimum_allowed integer;
  maximum_allowed integer;
begin
  for item in select value from jsonb_array_elements(coalesce(new.items, '[]'::jsonb)) loop
    select data into product_data from public.products where id = (item->>'productId')::uuid;
    requested := greatest(1, coalesce((item->>'quantity')::integer, 1));
    minimum_allowed := case when coalesce(product_data->>'minimumOrder', '') ~ '^[0-9]+$'
      then greatest(1, (product_data->>'minimumOrder')::integer) else 1 end;
    maximum_allowed := case when coalesce(product_data->>'unlimitedStock', 'true') = 'true' then 10000
      when coalesce(product_data->>'stockQuantity', '') ~ '^[0-9]+$' then greatest(0, (product_data->>'stockQuantity')::integer)
      else 1 end;
    if requested < minimum_allowed then
      raise exception 'A quantidade mínima para este produto é %', minimum_allowed;
    end if;
    if requested > maximum_allowed then
      raise exception 'Quantidade solicitada indisponível em estoque';
    end if;
  end loop;
  return new;
end;
$$;

drop trigger if exists validate_order_item_quantities_trigger on public.orders;
create trigger validate_order_item_quantities_trigger
before insert on public.orders
for each row execute function public.validate_order_item_quantities();

revoke all on function public.validate_order_item_quantities() from public, anon, authenticated;
drop function public.localize_supplier_catalog_text(text);
